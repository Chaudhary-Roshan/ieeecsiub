-- ====================================================================
-- Phase 4 Operations: Atomic Event Registration, Payments & Check-in
-- Version: 20261031150000
-- ====================================================================

-- 1. Atomic Event Registration RPC
CREATE OR REPLACE FUNCTION public.register_for_event(
    p_event_id TEXT,
    p_full_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_roll_number TEXT DEFAULT NULL,
    p_department TEXT DEFAULT 'Computer Science',
    p_is_ieee_member BOOLEAN DEFAULT FALSE,
    p_ieee_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event RECORD;
    v_current_count INTEGER;
    v_ticket_code TEXT;
    v_private_token TEXT;
    v_status TEXT;
    v_reg_id TEXT;
BEGIN
    -- Lock event row to prevent race conditions on last seat
    SELECT * INTO v_event
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event not found.');
    END IF;

    -- Check if registration deadline has passed
    IF v_event.registration_deadline IS NOT NULL AND CURRENT_TIMESTAMP > v_event.registration_deadline::timestamp THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration for this event has closed.');
    END IF;

    -- Check seat limit
    IF v_event.seats_limit IS NOT NULL AND v_event.seats_limit > 0 THEN
        SELECT COUNT(*) INTO v_current_count
        FROM public.registrations
        WHERE event_id = p_event_id AND status != 'CANCELLED';

        IF v_current_count >= v_event.seats_limit THEN
            RETURN jsonb_build_object('success', false, 'error', 'Event is sold out / maximum seats filled.');
        END IF;
    END IF;

    -- Check duplicate email for this event
    IF EXISTS (
        SELECT 1 FROM public.registrations
        WHERE event_id = p_event_id AND LOWER(email) = LOWER(TRIM(p_email)) AND status != 'CANCELLED'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'This email is already registered for this event.');
    END IF;

    -- Determine initial status: Free events are CONFIRMED immediately, Paid events are PAYMENT_PENDING
    IF COALESCE(v_event.fee_pkr, 0) > 0 THEN
        v_status := 'PAYMENT_PENDING';
    ELSE
        v_status := 'CONFIRMED';
    END IF;

    -- Generate unguessable ticket code & private token
    v_ticket_code := 'TCK-' || UPPER(encode(gen_random_bytes(4), 'hex'));
    v_private_token := encode(gen_random_bytes(16), 'hex');
    v_reg_id := 'reg-' || encode(gen_random_bytes(8), 'hex');

    -- Insert registration
    INSERT INTO public.registrations (
        id,
        event_id,
        full_name,
        email,
        phone,
        roll_number,
        department,
        is_ieee_member,
        ieee_membership_number,
        status,
        ticket_code,
        private_token,
        created_at
    ) VALUES (
        v_reg_id,
        p_event_id,
        TRIM(p_full_name),
        LOWER(TRIM(p_email)),
        TRIM(p_phone),
        TRIM(p_roll_number),
        TRIM(p_department),
        p_is_ieee_member,
        TRIM(p_ieee_number),
        v_status::registration_status,
        v_ticket_code,
        v_private_token,
        NOW()
    );

    -- Update registered_count on event
    UPDATE public.events
    SET registered_count = COALESCE(registered_count, 0) + 1
    WHERE id = p_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_reg_id,
        'ticketCode', v_ticket_code,
        'privateToken', v_private_token,
        'status', v_status,
        'feePkr', COALESCE(v_event.fee_pkr, 0)
    );
END;
$$;

-- 2. Submit Payment RPC
CREATE OR REPLACE FUNCTION public.submit_payment(
    p_private_token TEXT,
    p_method TEXT,
    p_transaction_id TEXT,
    p_proof_path TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reg RECORD;
    v_payment_id TEXT;
BEGIN
    SELECT * INTO v_reg
    FROM public.registrations
    WHERE private_token = p_private_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid registration token.');
    END IF;

    -- Check duplicate transaction_id
    IF EXISTS (
        SELECT 1 FROM public.payments
        WHERE UPPER(transaction_id) = UPPER(TRIM(p_transaction_id))
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'This transaction ID has already been submitted.');
    END IF;

    v_payment_id := 'pay-' || encode(gen_random_bytes(8), 'hex');

    INSERT INTO public.payments (
        id,
        registration_id,
        amount_pkr,
        payment_method,
        transaction_id,
        proof_path,
        status,
        created_at
    ) VALUES (
        v_payment_id,
        v_reg.id,
        0,
        p_method,
        UPPER(TRIM(p_transaction_id)),
        p_proof_path,
        'PENDING',
        NOW()
    );

    RETURN jsonb_build_object('success', true, 'paymentId', v_payment_id);
END;
$$;

-- 3. Verify Payment RPC
CREATE OR REPLACE FUNCTION public.verify_payment(
    p_payment_id TEXT,
    p_decision TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment RECORD;
BEGIN
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment record not found.');
    END IF;

    IF UPPER(p_decision) = 'VERIFIED' THEN
        UPDATE public.payments
        SET status = 'VERIFIED', verified_at = NOW()
        WHERE id = p_payment_id;

        UPDATE public.registrations
        SET status = 'CONFIRMED'
        WHERE id = v_payment.registration_id;
    ELSE
        UPDATE public.payments
        SET status = 'REJECTED', rejection_reason = p_reason
        WHERE id = p_payment_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Atomic Multi-device Check-In RPC
CREATE OR REPLACE FUNCTION public.check_in(
    p_ticket_code TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reg RECORD;
BEGIN
    -- Atomic update: only updates if status is CONFIRMED (prevents double scan across two phones)
    UPDATE public.registrations
    SET status = 'ATTENDED',
        checked_in_at = NOW(),
        checked_in_by = auth.uid(),
        manual_checkin_reason = p_reason
    WHERE UPPER(ticket_code) = UPPER(TRIM(p_ticket_code))
      AND status = 'CONFIRMED'
    RETURNING * INTO v_reg;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'ATTENDED',
            'fullName', v_reg.full_name,
            'rollNumber', v_reg.roll_number,
            'ticketCode', v_reg.ticket_code,
            'checkedInAt', v_reg.checked_in_at
        );
    END IF;

    -- If no row was updated, query why
    SELECT * INTO v_reg
    FROM public.registrations
    WHERE UPPER(ticket_code) = UPPER(TRIM(p_ticket_code));

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Ticket code not found in chapter database.'
        );
    ELSIF v_reg.status = 'ATTENDED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ALREADY_CHECKED_IN',
            'fullName', v_reg.full_name,
            'checkedInAt', v_reg.checked_in_at,
            'message', 'Attendee was already checked in at ' || to_char(v_reg.checked_in_at, 'HH12:MI AM')
        );
    ELSIF v_reg.status = 'PAYMENT_PENDING' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNPAID',
            'fullName', v_reg.full_name,
            'message', 'Registration payment is pending verification by the chapter treasurer.'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Ticket status is ' || v_reg.status::text || ' and cannot be checked in.'
        );
    END IF;
END;
$$;

-- Grant EXECUTE to public & authenticated
GRANT EXECUTE ON FUNCTION public.register_for_event TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_payment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_payment TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in TO authenticated;
