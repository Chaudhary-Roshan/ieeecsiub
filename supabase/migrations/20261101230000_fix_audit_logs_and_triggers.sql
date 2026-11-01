-- Migration: 20261101230000_fix_audit_logs_and_triggers.sql
-- Purpose: Harmonize audit_logs table schema and make process_audit_log() fail-safe

-- 1. Ensure all columns exist on public.audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_table TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_data JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS staff_user_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS staff_email TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS before_state JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS after_state JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Drop NOT NULL constraints on legacy columns if they exist
DO $$
BEGIN
  ALTER TABLE public.audit_logs ALTER COLUMN staff_email DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.audit_logs ALTER COLUMN entity_type DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Grant permissions on audit_logs
GRANT INSERT, SELECT ON public.audit_logs TO anon, authenticated, service_role;

-- 3. Fail-safe audit log trigger function
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
    -- Never let audit logging failure block primary database operations
    RAISE WARNING 'Audit logging failed: %', SQLERRM;
  END;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
