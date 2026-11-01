-- ====================================================================
-- Phase 1 Foundation: Identity, RBAC, Data Model, Audit & Storage
-- Version: 20261031140000
-- ====================================================================

-- 1. Enable Crypto Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Staff Roles Enum & Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM (
            'ADMIN',
            'CERTIFICATE_MANAGER',
            'TREASURER',
            'CHECKIN_STAFF',
            'CONTENT_EDITOR'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 3. SQL Helper: has_role(role_name)
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    -- Superadmin / Admin has all capabilities
    IF EXISTS (
        SELECT 1 FROM public.staff_roles 
        WHERE user_id = auth.uid() AND role = 'ADMIN'::app_role
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check specific role
    RETURN EXISTS (
        SELECT 1 FROM public.staff_roles 
        WHERE user_id = auth.uid() AND role::text = required_role
    );
END;
$$;

-- 4. Staff Users Table
CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Audit Logs Table (Append-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor UUID DEFAULT auth.uid(),
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

REVOKE UPDATE, DELETE ON public.audit_logs FROM PUBLIC, anon, authenticated;

-- Audit Trigger Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (actor, action, target_table, record_id, old_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (actor, action, target_table, record_id, old_data, new_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (actor, action, target_table, record_id, new_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- 6. Events Table Updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_published'
    ) THEN
        ALTER TABLE public.events ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_year'
    ) THEN
        ALTER TABLE public.events ADD COLUMN event_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;
END $$;

-- 7. Certificate Runs Table
CREATE TABLE IF NOT EXISTS public.certificate_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT,
    template TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('PER_PERSON', 'PER_TEAM')),
    source_file_path TEXT,
    rows_total INTEGER NOT NULL DEFAULT 0,
    rows_issued INTEGER NOT NULL DEFAULT 0,
    rows_skipped INTEGER NOT NULL DEFAULT 0,
    created_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    voided_at TIMESTAMPTZ
);

-- 8. Certificate Members Table (Kit Schema Team Roster)
CREATE TABLE IF NOT EXISTS public.certificate_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 1,
    member_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Certificate Versions Table (Immutable Ledger for Disputes)
CREATE TABLE IF NOT EXISTS public.certificate_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT NOT NULL,
    code TEXT NOT NULL,
    action TEXT NOT NULL, -- 'GENERATED', 'REPLACED', 'REVOKED', 'VOIDED'
    actor UUID DEFAULT auth.uid(),
    snapshot JSONB NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Certificate Settings Table (Replaces Hardcoded Certificate Templates)
CREATE TABLE IF NOT EXISTS public.certificate_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_code TEXT DEFAULT 'CS01',
    chapter_name TEXT DEFAULT 'IEEE Computer Society UCET-IUB Student Branch Chapter',
    verify_url TEXT DEFAULT 'https://ieeecsiub.vercel.app/verify',
    signatories JSONB DEFAULT '[]'::jsonb,
    logo_paths JSONB DEFAULT '{}'::jsonb,
    updated_by UUID DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Registrations Enhancements
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'checked_in_at'
    ) THEN
        ALTER TABLE public.registrations ADD COLUMN checked_in_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'checked_in_by'
    ) THEN
        ALTER TABLE public.registrations ADD COLUMN checked_in_by UUID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'manual_checkin_reason'
    ) THEN
        ALTER TABLE public.registrations ADD COLUMN manual_checkin_reason TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'private_token'
    ) THEN
        ALTER TABLE public.registrations ADD COLUMN private_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');
    END IF;
END $$;

-- 12. Storage Buckets (Ensuring buckets exist)
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('payment-proofs', 'payment-proofs', false),
    ('certificates', 'certificates', false),
    ('template-assets', 'template-assets', false),
    ('public-media', 'public-media', true)
ON CONFLICT (id) DO NOTHING;

-- 13. Narrow Public Certificate Verification RPC
CREATE OR REPLACE FUNCTION public.verify_certificate(cert_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    cert_row RECORD;
    members_list JSONB;
    settings_row RECORD;
BEGIN
    -- Query certificate
    SELECT * INTO cert_row
    FROM public.certificates
    WHERE UPPER(code) = UPPER(TRIM(cert_code));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', false);
    END IF;

    -- Query team members
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'position', position,
            'memberName', member_name
        ) ORDER BY position ASC
    ), '[]'::jsonb) INTO members_list
    FROM public.certificate_members
    WHERE certificate_id = cert_row.id::text;

    -- Query shared settings
    SELECT * INTO settings_row
    FROM public.certificate_settings
    LIMIT 1;

    RETURN jsonb_build_object(
        'found', true,
        'id', cert_row.id,
        'code', cert_row.code,
        'recipientName', cert_row.recipient_name,
        'teamName', cert_row.team_name,
        'teamLeader', cert_row.team_leader,
        'projectTitle', cert_row.project_title,
        'placement', cert_row.placement,
        'certificateType', cert_row.certificate_type,
        'eventName', cert_row.event_name,
        'eventDate', cert_row.event_date,
        'eventYear', cert_row.event_year,
        'status', cert_row.status,
        'revokedAt', cert_row.revoked_at,
        'revokeReason', cert_row.revoke_reason,
        'replacedByCode', cert_row.replaced_by_code,
        'issueDate', cert_row.issue_date,
        'members', members_list,
        'signatories', COALESCE(settings_row.signatories, '[]'::jsonb),
        'verifyUrl', COALESCE(settings_row.verify_url, 'https://ieeecsiub.vercel.app/verify')
    );
END;
$$;

-- Grant execute on verify RPC to anon and authenticated
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;

-- 14. Attach Audit Triggers to Sensitive Tables
DROP TRIGGER IF EXISTS audit_certificates_trg ON public.certificates;
CREATE TRIGGER audit_certificates_trg
AFTER INSERT OR UPDATE OR DELETE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_events_trg ON public.events;
CREATE TRIGGER audit_events_trg
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_registrations_trg ON public.registrations;
CREATE TRIGGER audit_registrations_trg
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

