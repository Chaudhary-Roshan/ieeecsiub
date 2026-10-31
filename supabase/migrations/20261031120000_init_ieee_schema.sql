-- ====================================================================
-- IEEE CS UCET-IUB Automated Migration
-- Version: 20261031120000
-- Project: ieeecsiub-db (gbuafbcebcbwzvefqhcr)
-- ====================================================================

-- Enable UUID & crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Types / Enums (Safely create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_status') THEN
        CREATE TYPE certificate_status AS ENUM ('ACTIVE', 'REVOKED', 'REPLACED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_source') THEN
        CREATE TYPE certificate_source AS ENUM ('UPLOAD_REGISTRY', 'IN_SITE_GENERATED', 'LEGACY_IMPORT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
        CREATE TYPE event_status AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'POSTPONED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_status') THEN
        CREATE TYPE batch_status AS ENUM ('STAGED', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
        CREATE TYPE registration_status AS ENUM ('REGISTERED', 'PAYMENT_PENDING', 'CONFIRMED', 'ATTENDED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role_type') THEN
        CREATE TYPE staff_role_type AS ENUM ('ADMIN', 'SITE_ADMIN');
    END IF;
END $$;

-- 1. Staff Users Table
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role staff_role_type NOT NULL DEFAULT 'ADMIN',
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    tenure_start DATE NOT NULL DEFAULT CURRENT_DATE,
    tenure_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Team Members (Officers & Faculty Advisors)
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    committee_year TEXT NOT NULL,
    photo_url TEXT,
    approved_bio TEXT,
    order_index INT DEFAULT 0,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    learning_objectives TEXT,
    target_audience TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    venue TEXT NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    status event_status DEFAULT 'UPCOMING',
    status_reason TEXT,
    seats_limit INT DEFAULT 60,
    registration_deadline TIMESTAMPTZ,
    fee_pkr NUMERIC(10, 2) DEFAULT 0.00,
    payment_instructions TEXT,
    certificate_type TEXT NOT NULL DEFAULT 'Certificate of Participation',
    certificate_rule TEXT,
    vtools_id TEXT,
    vtools_link TEXT,
    featured_image TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    event_report TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Event Teams & Projects (Competitions, Expos & Hackathons)
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

-- 5. Upload Batches (Staging & Two-Officer Approval)
CREATE TABLE IF NOT EXISTS public.upload_batches (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    uploaded_by TEXT,
    status batch_status DEFAULT 'STAGED',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code TEXT UNIQUE NOT NULL,
    recipient_name TEXT NOT NULL,
    public_name_format TEXT NOT NULL DEFAULT 'FULL_NAME',
    event_id TEXT,
    event_title TEXT NOT NULL,
    certificate_type TEXT NOT NULL,
    recognition_level TEXT NOT NULL DEFAULT 'CHAPTER_RECOGNITION',
    issuer_statement TEXT NOT NULL,
    activity_date DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approver_name TEXT NOT NULL,
    approver_role TEXT NOT NULL,
    status certificate_status DEFAULT 'ACTIVE',
    source certificate_source DEFAULT 'IN_SITE_GENERATED',
    batch_id TEXT,
    template_id TEXT,
    team_name TEXT,
    project_title TEXT,
    replaced_by_code TEXT,
    replacement_reason TEXT,
    revocation_date TIMESTAMPTZ,
    revocation_reason TEXT,
    sha256_fingerprint TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Certificate Versions
CREATE TABLE IF NOT EXISTS public.certificate_versions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    certificate_id TEXT NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    snapshot_data JSONB NOT NULL,
    change_reason TEXT NOT NULL,
    changed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id TEXT,
    private_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    full_name TEXT NOT NULL,
    name_display_preference TEXT NOT NULL DEFAULT 'FULL_NAME',
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    roll_number TEXT,
    is_ieee_member BOOLEAN DEFAULT FALSE,
    ieee_membership_number TEXT,
    department TEXT,
    photo_consent BOOLEAN DEFAULT TRUE,
    data_privacy_consent BOOLEAN DEFAULT TRUE,
    status registration_status DEFAULT 'REGISTERED',
    ticket_code TEXT,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Payments Queue Table
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    registration_id TEXT,
    recipient_name TEXT,
    event_title TEXT,
    amount_pkr NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    proof_image_url TEXT NOT NULL,
    status payment_status DEFAULT 'PENDING',
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    registration_id TEXT,
    ticket_code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_in_by TEXT,
    manual_checkin_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Certificate Templates Table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    background_svg_url TEXT,
    title_text TEXT NOT NULL DEFAULT 'CERTIFICATE OF PARTICIPATION',
    body_template TEXT NOT NULL DEFAULT '',
    html_content TEXT,
    chair_signature_url TEXT,
    advisor_signature_url TEXT,
    chair_name TEXT DEFAULT 'Muhammad Roshan Ashraf',
    chair_title TEXT DEFAULT 'Chair, IEEE CS Student Branch Chapter',
    advisor_name TEXT DEFAULT 'Dr. Asjad Amin',
    advisor_title TEXT DEFAULT 'Advisor, IEEE CS Student Branch Chapter',
    chapter_logo_url TEXT,
    university_logo_url TEXT,
    ieee_logo_url TEXT,
    event_logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    staff_user_id TEXT,
    staff_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. News & Announcements Table
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

-- 14. Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- Performance Indexes
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(code);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_event_teams_event ON public.event_teams(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);

-- -------------------------------------------------------------
-- Enable RLS and Permissive Policies for Web App Access
-- -------------------------------------------------------------
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

