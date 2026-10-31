-- ====================================================================
-- IEEE CS UCET-IUB Quick Fix: RLS Permissions & Missing Tables
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gbuafbcebcbwzvefqhcr/sql
-- ====================================================================

-- 1. Ensure event_teams table exists
CREATE TABLE IF NOT EXISTS public.event_teams (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    sr INT DEFAULT 1,
    team_name TEXT NOT NULL,
    project_title TEXT NOT NULL,
    team_leader TEXT NOT NULL,
    semester TEXT,
    member_count INT DEFAULT 1,
    team_members TEXT[] NOT NULL DEFAULT '{}',
    project_domain TEXT,
    position_award TEXT,
    demo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure news and contact_messages tables exist
CREATE TABLE IF NOT EXISTS public.news (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Automatically grant ALL operations (SELECT, INSERT, UPDATE, DELETE)
-- to public / anon role across all tables so the web app & admin console work seamlessly
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_anon" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public can manage %s" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public can view %s" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Staff can manage %s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_anon" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', tbl);
        EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role;', tbl);
    END LOOP;
END $$;
