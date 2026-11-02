-- ====================================================================
-- Migration: 20261103000000_fix_statement_timeout_and_performance.sql
-- Purpose:
--   1. Prevent statement timeout on Supabase by terminating idle locks
--   2. Add missing high-performance indexes on foreign keys & filter columns
--   3. Add atomic, high-performance clear_event_data and bulk_save_certificates RPCs
--   4. Fix register_for_event RPC type casting (UUID vs text) and add lock_timeout
-- ====================================================================

-- 1. Remove statement timeout for this migration execution
SET statement_timeout = 0;

-- 2. Terminate any blocked or idle transactions holding locks on tables
DO $$
BEGIN
  PERFORM pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state IN ('idle in transaction')
    AND pid <> pg_backend_pid();
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 3. High-Performance Indexes to eliminate sequential scans and timeouts
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON public.certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code_upper ON public.certificates(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificate_versions') THEN
    CREATE INDEX IF NOT EXISTS idx_certificate_versions_cert_id ON public.certificate_versions(certificate_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificate_members') THEN
    CREATE INDEX IF NOT EXISTS idx_certificate_members_cert_id ON public.certificate_members(certificate_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
  END IF;
END $$;

-- 4. Fail-safe, non-blocking process_audit_log
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec_id TEXT;
BEGIN
  BEGIN
    SET LOCAL statement_timeout = '2s';
    IF (TG_OP = 'DELETE') THEN
      v_rec_id := OLD.id::text;
      INSERT INTO public.audit_logs (
        actor, action, target_table, record_id, old_data,
        entity_type, entity_id, before_state
      ) VALUES (
        auth.uid(), TG_OP, TG_TABLE_NAME, v_rec_id, to_jsonb(OLD),
        TG_TABLE_NAME, v_rec_id, to_jsonb(OLD)
      );
      RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
      v_rec_id := NEW.id::text;
      INSERT INTO public.audit_logs (
        actor, action, target_table, record_id, old_data, new_data,
        entity_type, entity_id, before_state, after_state
      ) VALUES (
        auth.uid(), TG_OP, TG_TABLE_NAME, v_rec_id, to_jsonb(OLD), to_jsonb(NEW),
        TG_TABLE_NAME, v_rec_id, to_jsonb(OLD), to_jsonb(NEW)
      );
      RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
      v_rec_id := NEW.id::text;
      INSERT INTO public.audit_logs (
        actor, action, target_table, record_id, new_data,
        entity_type, entity_id, after_state
      ) VALUES (
        auth.uid(), TG_OP, TG_TABLE_NAME, v_rec_id, to_jsonb(NEW),
        TG_TABLE_NAME, v_rec_id, to_jsonb(NEW)
      );
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Audit logging must NEVER block or timeout primary operations
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 5. Atomic Fast Wipe: clear_event_data RPC
CREATE OR REPLACE FUNCTION public.clear_event_data(p_event_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cert_count INT := 0;
  v_reg_count INT := 0;
BEGIN
  SET LOCAL statement_timeout = '30s';
  SET LOCAL lock_timeout = '5s';

  -- Delete child certificate records if child tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificate_versions') THEN
    DELETE FROM public.certificate_versions
    WHERE certificate_id IN (
      SELECT id FROM public.certificates WHERE event_id = p_event_id OR event_id::text = p_event_id
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificate_members') THEN
    DELETE FROM public.certificate_members
    WHERE certificate_id IN (
      SELECT id FROM public.certificates WHERE event_id = p_event_id OR event_id::text = p_event_id
    );
  END IF;

  -- Delete certificates
  DELETE FROM public.certificates
  WHERE event_id = p_event_id OR event_id::text = p_event_id;
  GET DIAGNOSTICS v_cert_count = ROW_COUNT;

  -- Delete registrations
  DELETE FROM public.registrations
  WHERE event_id::text = p_event_id;
  GET DIAGNOSTICS v_reg_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_certificates', v_cert_count,
    'deleted_registrations', v_reg_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_event_data(TEXT) TO anon, authenticated, service_role;

-- 6. Atomic Fast Bulk Save Certificates RPC
CREATE OR REPLACE FUNCTION public.bulk_save_certificates(p_certs JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_count INT := 0;
BEGIN
  SET LOCAL statement_timeout = '30s';
  SET LOCAL lock_timeout = '5s';

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_certs) LOOP
    INSERT INTO public.certificates (
      code, recipient_name, public_name_format, event_id, event_title,
      certificate_type, recognition_level, issuer_statement, activity_date,
      issue_date, approver_name, approver_role, status, source,
      template_id, team_name, project_title, created_at
    ) VALUES (
      UPPER(TRIM(v_item->>'code')),
      COALESCE(v_item->>'recipient_name', 'Participant'),
      COALESCE(v_item->>'public_name_format', 'FULL_NAME'),
      v_item->>'event_id',
      COALESCE(v_item->>'event_title', 'UCET IUB Technical Session'),
      COALESCE(v_item->>'certificate_type', 'Certificate of Participation'),
      COALESCE(v_item->>'recognition_level', 'CHAPTER_RECOGNITION'),
      COALESCE(v_item->>'issuer_statement', 'In recognition of active participation and successful completion.'),
      COALESCE(v_item->>'activity_date', CURRENT_DATE::text),
      COALESCE(v_item->>'issue_date', CURRENT_DATE::text),
      COALESCE(v_item->>'approver_name', 'Muhammad Roshan Ashraf'),
      COALESCE(v_item->>'approver_role', 'Chapter Chair'),
      COALESCE(v_item->>'status', 'ACTIVE'),
      COALESCE(v_item->>'source', 'IN_SITE_GENERATED'),
      v_item->>'template_id',
      v_item->>'team_name',
      v_item->>'project_title',
      NOW()
    )
    ON CONFLICT (code) DO UPDATE
    SET
      recipient_name = EXCLUDED.recipient_name,
      event_id = EXCLUDED.event_id,
      event_title = EXCLUDED.event_title,
      certificate_type = EXCLUDED.certificate_type,
      status = EXCLUDED.status,
      template_id = EXCLUDED.template_id,
      team_name = EXCLUDED.team_name,
      project_title = EXCLUDED.project_title,
      updated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_save_certificates(JSONB) TO anon, authenticated, service_role;

-- 7. Fixed register_for_event RPC with safe type casting & lock_timeout
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
    v_event_uuid UUID;
BEGIN
    SET LOCAL statement_timeout = '15s';
    SET LOCAL lock_timeout = '4s';

    -- Validate and cast UUID safely
    BEGIN
        v_event_uuid := p_event_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_event_uuid := NULL;
    END;

    -- Query event
    SELECT * INTO v_event
    FROM public.events
    WHERE (v_event_uuid IS NOT NULL AND id = v_event_uuid) OR id::text = p_event_id;

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
        WHERE (event_id::text = p_event_id OR (v_event_uuid IS NOT NULL AND event_id = v_event_uuid))
          AND status != 'CANCELLED';

        IF v_current_count >= v_event.seats_limit THEN
            RETURN jsonb_build_object('success', false, 'error', 'Event is sold out / maximum seats filled.');
        END IF;
    END IF;

    -- Check duplicate email for this event
    IF EXISTS (
        SELECT 1 FROM public.registrations
        WHERE (event_id::text = p_event_id OR (v_event_uuid IS NOT NULL AND event_id = v_event_uuid))
          AND LOWER(email) = LOWER(TRIM(p_email))
          AND status != 'CANCELLED'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'This email is already registered for this event.');
    END IF;

    -- Determine initial status
    IF COALESCE(v_event.fee_pkr, 0) > 0 THEN
        v_status := 'PAYMENT_PENDING';
    ELSE
        v_status := 'CONFIRMED';
    END IF;

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
        COALESCE(v_event_uuid, p_event_id::uuid),
        TRIM(p_full_name),
        LOWER(TRIM(p_email)),
        TRIM(p_phone),
        TRIM(p_roll_number),
        TRIM(p_department),
        p_is_ieee_member,
        TRIM(p_ieee_number),
        v_status,
        v_ticket_code,
        v_private_token,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'ticket_code', v_ticket_code,
        'private_token', v_private_token,
        'status', v_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_for_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO anon, authenticated, service_role;


-- 8. Drop heavy audit trigger on public.events to prevent 4x JSONB duplication of image blobs
DROP TRIGGER IF EXISTS audit_events_trg ON public.events;

-- 9. Update save_event RPC with 60-second timeout guarantee for media uploads
CREATE OR REPLACE FUNCTION public.save_event(event_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT;
  v_slug TEXT;
  v_base_slug TEXT;
  v_target_id UUID;
  v_result JSONB;
BEGIN
  -- Prevent statement timeout on event photo uploads
  SET LOCAL statement_timeout = '60s';
  SET LOCAL lock_timeout = '5s';

  v_id := event_data->>'id';
  v_slug := COALESCE(event_data->>'slug', 'event-' || floor(extract(epoch from now())));
  v_base_slug := regexp_replace(v_slug, '^202[0-9]/', '');

  -- Locate existing event by ID (if UUID), exact slug, or base slug
  SELECT id INTO v_target_id FROM public.events
  WHERE 
    (v_id IS NOT NULL AND id::text = v_id)
    OR slug = v_slug
    OR slug = ('2026/' || v_base_slug)
    OR regexp_replace(slug, '^202[0-9]/', '') = v_base_slug
  LIMIT 1;

  IF v_target_id IS NOT NULL THEN
    -- UPDATE existing event
    UPDATE public.events
    SET
      slug = COALESCE(event_data->>'slug', slug),
      title = COALESCE(event_data->>'title', title),
      description = COALESCE(event_data->>'description', description),
      learning_objectives = COALESCE(event_data->>'learning_objectives', event_data->>'learningObjectives', learning_objectives),
      target_audience = COALESCE(event_data->>'target_audience', event_data->>'targetAudience', target_audience),
      start_date = COALESCE((event_data->>'start_date')::timestamptz, (event_data->>'startDate')::timestamptz, start_date),
      end_date = COALESCE((event_data->>'end_date')::timestamptz, (event_data->>'endDate')::timestamptz, end_date),
      venue = COALESCE(event_data->>'venue', venue),
      is_online = COALESCE((event_data->>'is_online')::boolean, (event_data->>'isOnline')::boolean, is_online),
      meeting_link = COALESCE(event_data->>'meeting_link', event_data->>'meetingLink', meeting_link),
      status = COALESCE((event_data->>'status')::event_status, status),
      status_reason = COALESCE(event_data->>'status_reason', event_data->>'statusReason', status_reason),
      seats_limit = COALESCE((event_data->>'seats_limit')::int, (event_data->>'seatsLimit')::int, seats_limit),
      fee_pkr = COALESCE((event_data->>'fee_pkr')::numeric, (event_data->>'feePkr')::numeric, fee_pkr),
      payment_instructions = COALESCE(event_data->>'payment_instructions', event_data->>'paymentInstructions', payment_instructions),
      certificate_type = COALESCE(event_data->>'certificate_type', event_data->>'certificateType', certificate_type),
      certificate_rule = COALESCE(event_data->>'certificate_rule', event_data->>'certificateRule', certificate_rule),
      vtools_id = COALESCE(event_data->>'vtools_id', event_data->>'vtoolsId', vtools_id),
      vtools_link = COALESCE(event_data->>'vtools_link', event_data->>'vtoolsLink', vtools_link),
      featured_image = COALESCE(event_data->>'featured_image', event_data->>'featuredImage', featured_image),
      gallery_images = COALESCE(event_data->'gallery_images', event_data->'galleryImages', gallery_images),
      event_report = COALESCE(event_data->>'event_report', event_data->>'eventReport', event_report),
      speakers = COALESCE(event_data->'speakers', '[]'::jsonb),
      is_published = COALESCE((event_data->>'is_published')::boolean, is_published),
      updated_at = NOW()
    WHERE id = v_target_id
    RETURNING to_jsonb(public.events.*) INTO v_result;
  ELSE
    -- INSERT new event
    INSERT INTO public.events (
      slug, title, description, learning_objectives, target_audience,
      start_date, end_date, venue, is_online, meeting_link,
      status, status_reason, seats_limit, fee_pkr, payment_instructions,
      certificate_type, certificate_rule, vtools_id, vtools_link,
      featured_image, gallery_images, event_report, speakers, is_published, created_at, updated_at
    ) VALUES (
      v_slug,
      COALESCE(event_data->>'title', 'Untitled Event'),
      COALESCE(event_data->>'description', ''),
      COALESCE(event_data->>'learning_objectives', event_data->>'learningObjectives'),
      COALESCE(event_data->>'target_audience', event_data->>'targetAudience'),
      COALESCE((event_data->>'start_date')::timestamptz, (event_data->>'startDate')::timestamptz, NOW()),
      COALESCE((event_data->>'end_date')::timestamptz, (event_data->>'endDate')::timestamptz, NOW() + INTERVAL '1 day'),
      COALESCE(event_data->>'venue', 'UCET IUB'),
      COALESCE((event_data->>'is_online')::boolean, (event_data->>'isOnline')::boolean, false),
      COALESCE(event_data->>'meeting_link', event_data->>'meetingLink'),
      COALESCE((event_data->>'status')::event_status, 'UPCOMING'::event_status),
      COALESCE(event_data->>'status_reason', event_data->>'statusReason'),
      COALESCE((event_data->>'seats_limit')::int, (event_data->>'seatsLimit')::int, 60),
      COALESCE((event_data->>'fee_pkr')::numeric, (event_data->>'feePkr')::numeric, 0),
      COALESCE(event_data->>'payment_instructions', event_data->>'paymentInstructions'),
      COALESCE(event_data->>'certificate_type', event_data->>'certificateType', 'Certificate of Participation'),
      COALESCE(event_data->>'certificate_rule', event_data->>'certificateRule', 'Minimum 80% physical attendance verified via digital check-in'),
      COALESCE(event_data->>'vtools_id', event_data->>'vtoolsId'),
      COALESCE(event_data->>'vtools_link', event_data->>'vtoolsLink'),
      COALESCE(event_data->>'featured_image', event_data->>'featuredImage', '/ieee-cs-logo.png'),
      COALESCE(event_data->'gallery_images', event_data->'galleryImages', '[]'::jsonb),
      COALESCE(event_data->>'event_report', event_data->>'eventReport'),
      COALESCE(event_data->'speakers', '[]'::jsonb),
      COALESCE((event_data->>'is_published')::boolean, true),
      NOW(),
      NOW()
    )
    RETURNING to_jsonb(public.events.*) INTO v_result;
  END IF;

  RETURN jsonb_build_object('success', true, 'event', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_event(JSONB) TO anon, authenticated, service_role;

-- 10. Configure public-media storage bucket for CDN hosting
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('public-media', 'public-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']) 
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view public-media" ON storage.objects;
  CREATE POLICY "Public can view public-media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'public-media');

  DROP POLICY IF EXISTS "Anyone can upload to public-media" ON storage.objects;
  CREATE POLICY "Anyone can upload to public-media" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'public-media');

  DROP POLICY IF EXISTS "Anyone can update public-media" ON storage.objects;
  CREATE POLICY "Anyone can update public-media" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'public-media');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
