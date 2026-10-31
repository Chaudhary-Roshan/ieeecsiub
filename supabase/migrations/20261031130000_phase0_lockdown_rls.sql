-- ====================================================================
-- Phase 0: Security Hardening & Deny-by-Default RLS Lockdown
-- Version: 20261031130000
-- ====================================================================

-- 1. Remove open policies and revoke default permissions from anon
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_anon" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public can manage %s" ON public.%I;', tbl, tbl);
        EXECUTE format('REVOKE ALL ON public.%I FROM anon;', tbl);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    END LOOP;
END $$;

-- 2. Grant SELECT only on public-facing read tables to anon
GRANT SELECT ON public.events TO anon;
DROP POLICY IF EXISTS "Public can view events" ON public.events;
CREATE POLICY "Public can view events" 
    ON public.events FOR SELECT TO anon 
    USING (true);

GRANT SELECT ON public.team_members TO anon;
DROP POLICY IF EXISTS "Public can view team members" ON public.team_members;
CREATE POLICY "Public can view team members" 
    ON public.team_members FOR SELECT TO anon 
    USING (true);

GRANT SELECT ON public.event_teams TO anon;
DROP POLICY IF EXISTS "Public can view event teams" ON public.event_teams;
CREATE POLICY "Public can view event teams" 
    ON public.event_teams FOR SELECT TO anon 
    USING (true);

GRANT SELECT ON public.certificate_templates TO anon;
DROP POLICY IF EXISTS "Public can view certificate templates" ON public.certificate_templates;
CREATE POLICY "Public can view certificate templates" 
    ON public.certificate_templates FOR SELECT TO anon 
    USING (true);

-- 3. Certificates: Public can SELECT for verification, but NO anon INSERT / UPDATE / DELETE
GRANT SELECT ON public.certificates TO anon;
DROP POLICY IF EXISTS "Public can view valid certificates" ON public.certificates;
CREATE POLICY "Public can view valid certificates" 
    ON public.certificates FOR SELECT TO anon 
    USING (status IN ('ACTIVE', 'REVOKED', 'REPLACED'));

-- 4. Registrations: Public can only INSERT
GRANT INSERT ON public.registrations TO anon;
DROP POLICY IF EXISTS "Public can submit registration" ON public.registrations;
CREATE POLICY "Public can submit registration" 
    ON public.registrations FOR INSERT TO anon 
    WITH CHECK (true);

-- 5. Contact Messages: Public can only INSERT
GRANT INSERT ON public.contact_messages TO anon;
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages" 
    ON public.contact_messages FOR INSERT TO anon 
    WITH CHECK (true);

-- 6. Authenticated & Service Role maintain full access
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('GRANT ALL ON public.%I TO authenticated, service_role;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated full access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Authenticated full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;
