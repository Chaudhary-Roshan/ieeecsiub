-- ====================================================================
-- IEEE CS UCET-IUB: IMMEDIATE COMPREHENSIVE DATABASE FIX
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gbuafbcebcbwzvefqhcr/sql
-- ====================================================================

SET statement_timeout = 0;

-- 1. Ensure upload_batches table exists
CREATE TABLE IF NOT EXISTS public.upload_batches (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    event_id TEXT,
    event_title TEXT,
    row_count INTEGER DEFAULT 0,
    uploaded_by TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'STAGED',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    staged_rows JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Open up Table Permissions for anon and authenticated
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS recipient_roll_number TEXT;

GRANT ALL ON public.certificates TO anon, authenticated, service_role;
GRANT ALL ON public.upload_batches TO anon, authenticated, service_role;
GRANT ALL ON public.events TO anon, authenticated, service_role;
GRANT ALL ON public.registrations TO anon, authenticated, service_role;
GRANT ALL ON public.team_members TO anon, authenticated, service_role;
GRANT ALL ON public.event_teams TO anon, authenticated, service_role;
GRANT ALL ON public.certificate_templates TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;

-- 3. Configure Policies for Permissive Access
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view valid certificates" ON public.certificates;
DROP POLICY IF EXISTS "Allow all certificates access" ON public.certificates;
CREATE POLICY "Allow all certificates access" 
    ON public.certificates FOR ALL TO anon, authenticated, service_role 
    USING (true) WITH CHECK (true);

ALTER TABLE public.upload_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all upload_batches access" ON public.upload_batches;
CREATE POLICY "Allow all upload_batches access" 
    ON public.upload_batches FOR ALL TO anon, authenticated, service_role 
    USING (true) WITH CHECK (true);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view events" ON public.events;
DROP POLICY IF EXISTS "Allow all events access" ON public.events;
CREATE POLICY "Allow all events access" 
    ON public.events FOR ALL TO anon, authenticated, service_role 
    USING (true) WITH CHECK (true);

-- 4. High-Performance Bulk Save Certificates RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.bulk_save_certificates(p_certs JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_count INT := 0;
  v_code TEXT;
BEGIN
  SET LOCAL statement_timeout = '45s';
  SET LOCAL lock_timeout = '10s';

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_certs) LOOP
    v_code := UPPER(TRIM(v_item->>'code'));
    IF v_code IS NOT NULL AND v_code <> '' THEN
      INSERT INTO public.certificates (
        code,
        recipient_name,
        recipient_email,
        recipient_roll_number,
        public_name_format,
        event_id,
        event_title,
        certificate_type,
        recognition_level,
        issuer_statement,
        activity_date,
        issue_date,
        approver_name,
        approver_role,
        status,
        source,
        template_id,
        team_name,
        project_title,
        created_at,
        updated_at
      ) VALUES (
        v_code,
        COALESCE(v_item->>'recipient_name', 'Participant'),
        NULLIF(v_item->>'recipient_email', ''),
        NULLIF(v_item->>'recipient_roll_number', ''),
        COALESCE(v_item->>'public_name_format', 'FULL_NAME'),
        NULLIF(v_item->>'event_id', ''),
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
        NULLIF(v_item->>'template_id', ''),
        NULLIF(v_item->>'team_name', ''),
        NULLIF(v_item->>'project_title', ''),
        NOW(),
        NOW()
      )
      ON CONFLICT (code) DO UPDATE
      SET
        recipient_name = EXCLUDED.recipient_name,
        recipient_email = COALESCE(EXCLUDED.recipient_email, certificates.recipient_email),
        recipient_roll_number = COALESCE(EXCLUDED.recipient_roll_number, certificates.recipient_roll_number),
        event_id = COALESCE(EXCLUDED.event_id, certificates.event_id),
        event_title = COALESCE(EXCLUDED.event_title, certificates.event_title),
        certificate_type = EXCLUDED.certificate_type,
        recognition_level = EXCLUDED.recognition_level,
        status = 'ACTIVE',
        team_name = COALESCE(EXCLUDED.team_name, certificates.team_name),
        project_title = COALESCE(EXCLUDED.project_title, certificates.project_title),
        updated_at = NOW();

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_save_certificates(JSONB) TO anon, authenticated, service_role;

-- 5. Safe non-blocking audit logging trigger
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    SET LOCAL statement_timeout = '2s';
    IF (TG_OP = 'DELETE') THEN
      INSERT INTO public.audit_logs (actor, action, target_table, record_id, old_data, entity_type, entity_id, before_state)
      VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD), TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
      RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
      INSERT INTO public.audit_logs (actor, action, target_table, record_id, old_data, new_data, entity_type, entity_id, before_state, after_state)
      VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW), TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
      RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
      INSERT INTO public.audit_logs (actor, action, target_table, record_id, new_data, entity_type, entity_id, after_state)
      VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW), TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 6. Atomic Clear Event Data RPC
CREATE OR REPLACE FUNCTION public.clear_event_data(p_event_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_certs_count INT := 0;
  v_regs_count INT := 0;
  v_teams_count INT := 0;
  v_event_uuid UUID;
BEGIN
  SET LOCAL statement_timeout = '45s';
  SET LOCAL lock_timeout = '10s';

  BEGIN
    v_event_uuid := p_event_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_event_uuid := NULL;
  END;

  -- 1. Delete certificates for this event
  WITH deleted_certs AS (
    DELETE FROM public.certificates
    WHERE event_id = p_event_id
       OR (v_event_uuid IS NOT NULL AND event_id = v_event_uuid::text)
    RETURNING 1
  )
  SELECT count(*) INTO v_certs_count FROM deleted_certs;

  -- 2. Delete registrations for this event
  WITH deleted_regs AS (
    DELETE FROM public.registrations
    WHERE event_id::text = p_event_id
       OR (v_event_uuid IS NOT NULL AND event_id = v_event_uuid)
    RETURNING 1
  )
  SELECT count(*) INTO v_regs_count FROM deleted_regs;

  -- 3. Delete event teams
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_teams') THEN
    WITH deleted_teams AS (
      DELETE FROM public.event_teams
      WHERE event_id::text = p_event_id
         OR (v_event_uuid IS NOT NULL AND event_id = v_event_uuid)
      RETURNING 1
    )
    SELECT count(*) INTO v_teams_count FROM deleted_teams;
  END IF;

  -- 4. Reset event registered count
  UPDATE public.events
  SET registered_count = 0, updated_at = NOW()
  WHERE id::text = p_event_id
     OR (v_event_uuid IS NOT NULL AND id = v_event_uuid);

  RETURN jsonb_build_object(
    'success', true,
    'deleted_certificates', v_certs_count,
    'deleted_registrations', v_regs_count,
    'deleted_teams', v_teams_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_event_data(TEXT) TO anon, authenticated, service_role;

-- 7. High Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON public.certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code_upper ON public.certificates(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);

