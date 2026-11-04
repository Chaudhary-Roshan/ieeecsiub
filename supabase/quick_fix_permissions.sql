-- ====================================================================
-- IEEE CS UCET-IUB Quick Fix & Security Hardening (Phase 0)
-- ====================================================================

-- 1. Ensure all essential tables and columns exist
CREATE TABLE IF NOT EXISTS public.chapter_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    email_general TEXT NOT NULL DEFAULT 'ieeecsiub.contact@gmail.com',
    email_verify TEXT NOT NULL DEFAULT 'ieeecsiub.contact@gmail.com',
    whatsapp_group_url TEXT NOT NULL DEFAULT 'https://chat.whatsapp.com/sample-ieee-cs-ucet-iub',
    whatsapp_chat_number TEXT NOT NULL DEFAULT '923000000000',
    linkedin_url TEXT NOT NULL DEFAULT 'https://www.linkedin.com/company/ieee-cs-ucet-iub',
    instagram_url TEXT NOT NULL DEFAULT 'https://www.instagram.com/ieeecsucetiub',
    facebook_url TEXT NOT NULL DEFAULT 'https://www.facebook.com/ieeecsucetiub',
    github_url TEXT NOT NULL DEFAULT 'https://github.com/ieee-cs-ucet-iub',
    parent_branch_url TEXT NOT NULL DEFAULT 'https://edu.ieee.org/pk-ucetiub',
    section_url TEXT NOT NULL DEFAULT 'https://ieeebahawalpurssection.org/',
    address_room_1 TEXT NOT NULL DEFAULT 'Room No. 1.25, Department of Information and Communication Engineering, Old Engineering Building, UCET',
    address_room_2 TEXT NOT NULL DEFAULT 'Room No. 105, Faculty of Engineering, IUB, Baghdad-ul-Jadeed Campus, Bahawalpur, Pakistan.',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

INSERT INTO public.chapter_settings (id, email_general, email_verify, whatsapp_group_url, whatsapp_chat_number, linkedin_url, instagram_url, facebook_url, github_url, parent_branch_url, section_url, address_room_1, address_room_2)
VALUES (
    'current',
    'ieeecsiub.contact@gmail.com',
    'ieeecsiub.contact@gmail.com',
    'https://chat.whatsapp.com/sample-ieee-cs-ucet-iub',
    '923000000000',
    'https://www.linkedin.com/company/ieee-cs-ucet-iub',
    'https://www.instagram.com/ieeecsucetiub',
    'https://www.facebook.com/ieeecsucetiub',
    'https://github.com/ieee-cs-ucet-iub',
    'https://edu.ieee.org/pk-ucetiub',
    'https://ieeebahawalpurssection.org/',
    'Room No. 1.25, Department of Information and Communication Engineering, Old Engineering Building, UCET',
    'Room No. 105, Faculty of Engineering, IUB, Baghdad-ul-Jadeed Campus, Bahawalpur, Pakistan.'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.event_teams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    team_leader TEXT NOT NULL,
    project_title TEXT,
    placement TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.certificates ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE IF EXISTS public.certificates ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE IF EXISTS public.certificates ADD COLUMN IF NOT EXISTS project_title TEXT;
NOTIFY pgrst, 'reload schema';

-- 2. Revoke all permissions from anon
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

-- 3. Public read-only access on published resources
GRANT SELECT ON public.events TO anon;
DROP POLICY IF EXISTS "Public can view events" ON public.events;
CREATE POLICY "Public can view events" ON public.events FOR SELECT TO anon USING (true);

GRANT SELECT ON public.team_members TO anon;
DROP POLICY IF EXISTS "Public can view team members" ON public.team_members;
CREATE POLICY "Public can view team members" ON public.team_members FOR SELECT TO anon USING (true);

GRANT SELECT ON public.event_teams TO anon;
DROP POLICY IF EXISTS "Public can view event teams" ON public.event_teams;
CREATE POLICY "Public can view event teams" ON public.event_teams FOR SELECT TO anon USING (true);

GRANT SELECT ON public.certificate_templates TO anon;
DROP POLICY IF EXISTS "Public can view certificate templates" ON public.certificate_templates;
CREATE POLICY "Public can view certificate templates" ON public.certificate_templates FOR SELECT TO anon USING (true);

-- 4. Certificates: Public can SELECT for verification, but NO anon INSERT / UPDATE / DELETE
GRANT SELECT ON public.certificates TO anon;
DROP POLICY IF EXISTS "Public can view valid certificates" ON public.certificates;
CREATE POLICY "Public can view valid certificates" ON public.certificates FOR SELECT TO anon USING (status IN ('ACTIVE', 'REVOKED', 'REPLACED'));

-- 5. Public write-only on registrations and contact messages
GRANT INSERT ON public.registrations TO anon;
DROP POLICY IF EXISTS "Public can submit registration" ON public.registrations;
CREATE POLICY "Public can submit registration" ON public.registrations FOR INSERT TO anon WITH CHECK (true);

GRANT INSERT ON public.contact_messages TO anon;
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages" ON public.contact_messages FOR INSERT TO anon WITH CHECK (true);

-- 6. Authenticated & Service Role have full access
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
        EXECUTE format('CREATE POLICY "Authenticated full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;
