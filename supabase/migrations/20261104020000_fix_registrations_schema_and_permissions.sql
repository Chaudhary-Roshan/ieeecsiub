-- Migration: Fix Registrations Schema, Permissions and Bulk Upsert RPC
-- Ensures public and admin portal can view, insert, update and bulk-sync registrations safely

DO $$
BEGIN
  -- 1. Ensure columns exist on registrations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'ticket_code'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN ticket_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'degree_program'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN degree_program TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'roll_number'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN roll_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN department TEXT DEFAULT 'Computer Science';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'is_ieee_member'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN is_ieee_member BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'ieee_membership_number'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN ieee_membership_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'photo_consent'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN photo_consent BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN status TEXT DEFAULT 'CONFIRMED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'checked_in_at'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN checked_in_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'private_token'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN private_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');
  END IF;
END $$;

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_code ON public.registrations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_registrations_event_email ON public.registrations(event_id, LOWER(email));
CREATE INDEX IF NOT EXISTS idx_registrations_roll_number ON public.registrations(LOWER(roll_number));

-- 3. RLS Permissions
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select on registrations" ON public.registrations;
CREATE POLICY "Allow select on registrations"
    ON public.registrations FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow insert on registrations" ON public.registrations;
CREATE POLICY "Allow insert on registrations"
    ON public.registrations FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on registrations" ON public.registrations;
CREATE POLICY "Allow update on registrations"
    ON public.registrations FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete on registrations" ON public.registrations;
CREATE POLICY "Allow delete on registrations"
    ON public.registrations FOR DELETE TO anon, authenticated
    USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO anon, authenticated, service_role;

-- 4. Bulk Save & Deduplicate Registrations RPC
CREATE OR REPLACE FUNCTION public.bulk_save_registrations(p_regs JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_count INT := 0;
  v_id TEXT;
  v_event_id TEXT;
  v_email TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_roll TEXT;
  v_ticket TEXT;
  v_existing_id TEXT;
BEGIN
  SET LOCAL statement_timeout = '60s';
  SET LOCAL lock_timeout = '5s';

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_regs) LOOP
    v_event_id := TRIM(COALESCE(v_item->>'event_id', v_item->>'eventId', ''));
    v_email := LOWER(TRIM(COALESCE(v_item->>'email', '')));
    v_full_name := TRIM(COALESCE(v_item->>'full_name', v_item->>'fullName', ''));
    v_phone := TRIM(COALESCE(v_item->>'phone', ''));
    v_roll := TRIM(COALESCE(v_item->>'roll_number', v_item->>'rollNumber', ''));
    v_ticket := TRIM(COALESCE(v_item->>'ticket_code', v_item->>'ticketCode', ''));
    v_id := TRIM(COALESCE(v_item->>'id', ''));

    IF v_full_name IS NULL OR v_full_name = '' THEN
      CONTINUE;
    END IF;

    -- Look up existing registration by id, ticket_code, or (event_id, email)
    v_existing_id := NULL;
    IF v_id <> '' THEN
      SELECT id INTO v_existing_id FROM public.registrations WHERE id = v_id LIMIT 1;
    END IF;

    IF v_existing_id IS NULL AND v_ticket <> '' THEN
      SELECT id INTO v_existing_id FROM public.registrations WHERE ticket_code = v_ticket LIMIT 1;
    END IF;

    IF v_existing_id IS NULL AND v_event_id <> '' AND v_email <> '' THEN
      SELECT id INTO v_existing_id FROM public.registrations WHERE event_id = v_event_id AND LOWER(email) = v_email LIMIT 1;
    END IF;

    IF v_existing_id IS NOT NULL THEN
      -- Update existing record with best available information
      UPDATE public.registrations
      SET
        full_name = v_full_name,
        phone = CASE WHEN v_phone <> '' AND v_phone <> '0300-0000000' THEN v_phone ELSE registrations.phone END,
        roll_number = CASE WHEN v_roll <> '' AND v_roll <> 'N/A' THEN v_roll ELSE registrations.roll_number END,
        department = COALESCE(v_item->>'department', registrations.department),
        degree_program = COALESCE(v_item->>'degree_program', v_item->>'degreeProgram', registrations.degree_program),
        is_ieee_member = COALESCE((v_item->>'is_ieee_member')::boolean, (v_item->>'isIeeeMember')::boolean, registrations.is_ieee_member),
        ieee_membership_number = COALESCE(v_item->>'ieee_membership_number', v_item->>'ieeeMembershipNumber', registrations.ieee_membership_number),
        status = COALESCE(v_item->>'status', registrations.status)
      WHERE id = v_existing_id;
    ELSE
      -- Insert new record
      IF v_id = '' THEN
        v_id := 'reg-' || encode(gen_random_bytes(8), 'hex');
      END IF;
      IF v_ticket = '' THEN
        v_ticket := 'TCK-' || UPPER(encode(gen_random_bytes(4), 'hex'));
      END IF;

      INSERT INTO public.registrations (
        id, event_id, full_name, email, phone, roll_number,
        department, degree_program, is_ieee_member, ieee_membership_number,
        status, ticket_code, private_token
      ) VALUES (
        v_id,
        v_event_id,
        v_full_name,
        v_email,
        v_phone,
        v_roll,
        COALESCE(v_item->>'department', 'Computer Science'),
        COALESCE(v_item->>'degree_program', v_item->>'degreeProgram', NULL),
        COALESCE((v_item->>'is_ieee_member')::boolean, (v_item->>'isIeeeMember')::boolean, FALSE),
        COALESCE(v_item->>'ieee_membership_number', v_item->>'ieeeMembershipNumber', NULL),
        COALESCE(v_item->>'status', 'CONFIRMED'),
        v_ticket,
        COALESCE(v_item->>'private_token', v_item->>'privateToken', encode(gen_random_bytes(16), 'hex'))
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', v_count);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_save_registrations(JSONB) TO anon, authenticated, service_role;

