-- Migration: 20261101210000_wipe_all_data.sql
-- Purpose: Complete wipe of all certificate records, operational data, events, teams, and audit history as requested by Chapter Chair

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'certificate_versions', 'certificate_members', 'certificates',
    'certificate_runs', 'upload_batches', 'payments', 'tickets',
    'registrations', 'event_teams', 'events', 'team_members',
    'news', 'contact_messages'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('TRUNCATE TABLE public.%I CASCADE', t);
    END IF;
  END LOOP;
END $$;

-- 4. Wipe Audit Trail (Temporarily bypass append-only trigger)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    DROP TRIGGER IF EXISTS prevent_audit_logs_mutation_trigger ON public.audit_logs;
    TRUNCATE TABLE public.audit_logs CASCADE;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_audit_logs_mutation') THEN
      CREATE TRIGGER prevent_audit_logs_mutation_trigger
      BEFORE UPDATE OR DELETE ON public.audit_logs
      FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_logs_mutation();
    END IF;
  END IF;
END $$;

-- 5. Wipe Storage Objects from Buckets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    DELETE FROM storage.objects WHERE bucket_id IN ('certificates', 'payment-proofs');
  END IF;
END $$;
