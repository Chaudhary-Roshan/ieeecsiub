-- Migration: 20261101210000_wipe_all_data.sql
-- Purpose: Complete wipe of all certificate records, operational data, events, teams, and audit history as requested by Chapter Chair

-- 1. Wipe Certificates & Credentials
TRUNCATE TABLE public.certificate_versions CASCADE;
TRUNCATE TABLE public.certificate_members CASCADE;
TRUNCATE TABLE public.certificates CASCADE;
TRUNCATE TABLE public.certificate_runs CASCADE;
TRUNCATE TABLE public.upload_batches CASCADE;

-- 2. Wipe Event Operations, Registrations & Payments
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.tickets CASCADE;
TRUNCATE TABLE public.registrations CASCADE;

-- 3. Wipe Events, Event Teams & Rosters
TRUNCATE TABLE public.event_teams CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.team_members CASCADE;
TRUNCATE TABLE public.news CASCADE;
TRUNCATE TABLE public.contact_messages CASCADE;

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
