-- ====================================================================
-- IEEE CS UCET-IUB Official Database Schema (PostgreSQL / Supabase)
-- IEEE Computer Society Student Branch Chapter, UCET - IUB
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Certificate Status Enum
CREATE TYPE certificate_status AS ENUM ('ACTIVE', 'REVOKED', 'REPLACED');
CREATE TYPE certificate_source AS ENUM ('UPLOAD_REGISTRY', 'IN_SITE_GENERATED', 'LEGACY_IMPORT');
CREATE TYPE event_status AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'POSTPONED', 'CANCELLED');
CREATE TYPE batch_status AS ENUM ('STAGED', 'APPROVED', 'REJECTED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE registration_status AS ENUM ('REGISTERED', 'PAYMENT_PENDING', 'CONFIRMED', 'ATTENDED', 'CANCELLED');
CREATE TYPE staff_role_type AS ENUM ('SITE_ADMIN', 'CONTENT_MANAGER', 'CERTIFICATE_APPROVER', 'TREASURER', 'CHECKIN_STAFF');

-- 1. Staff Users and Role-Based Access Control
CREATE TABLE staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role staff_role_type NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    tenure_start DATE NOT NULL,
    tenure_end DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Team Members (Advisors, ExCom & Archive)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    committee_year TEXT NOT NULL, -- e.g. "2026-2027", "2025-2026"
    photo_url TEXT,
    approved_bio TEXT,
    order_index INT DEFAULT 0,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- Permanent URL: e.g. 2026/flutter-workshop
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    learning_objectives TEXT,
    target_audience TEXT,
    start_date TIMESTAMPTZ NOT NULL, -- UTC
    end_date TIMESTAMPTZ NOT NULL,   -- UTC
    venue TEXT NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    status event_status DEFAULT 'UPCOMING',
    status_reason TEXT, -- For postponed/cancelled banners
    seats_limit INT,
    registration_deadline TIMESTAMPTZ,
    fee_pkr NUMERIC(10, 2) DEFAULT 0.00,
    payment_instructions TEXT,
    certificate_type TEXT NOT NULL, -- e.g. "Certificate of Participation", "Merit"
    certificate_rule TEXT, -- e.g. "Attend both days and submit the lab task"
    vtools_id TEXT,
    vtools_link TEXT,
    featured_image TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    event_report TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Upload Batches (Option 1 Staging & Two-Officer Approval)
CREATE TABLE upload_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES staff_users(id),
    status batch_status DEFAULT 'STAGED',
    approved_by UUID REFERENCES staff_users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Certificates Table (Verified on the public /verify page)
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g. CSIUB-26-7K3M-Q9TD (Random + Checksum)
    recipient_name TEXT NOT NULL,
    public_name_format TEXT NOT NULL DEFAULT 'FULL_NAME', -- 'FULL_NAME' or 'FIRST_INITIAL'
    event_id UUID REFERENCES events(id) ON DELETE RESTRICT,
    event_title TEXT NOT NULL,
    certificate_type TEXT NOT NULL, -- Participation, Completion, Appreciation, Speaker
    recognition_level TEXT DEFAULT 'CHAPTER_RECOGNITION', -- Chapter-issued vs Joint
    issuer_statement TEXT DEFAULT 'This is a chapter recognition, not an IEEE credential.',
    activity_date DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approver_name TEXT NOT NULL,
    approver_role TEXT NOT NULL, -- e.g. "Chapter Chair", "Faculty Advisor"
    status certificate_status DEFAULT 'ACTIVE',
    source certificate_source NOT NULL DEFAULT 'UPLOAD_REGISTRY',
    batch_id UUID REFERENCES upload_batches(id) ON DELETE SET NULL,
    replaced_by_code TEXT, -- If REPLACED, links to new certificate code
    replacement_reason TEXT,
    revocation_date DATE,
    revocation_reason TEXT,
    sha256_fingerprint TEXT, -- SHA-256 hash of official original PDF
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Certificate Versions & Snapshots
CREATE TABLE certificate_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    data_snapshot JSONB NOT NULL,
    sha256_hash TEXT,
    pdf_url TEXT,
    reason TEXT,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Option 2: Event Registrations
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    private_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    full_name TEXT NOT NULL,
    name_display_preference TEXT NOT NULL DEFAULT 'FULL_NAME', -- or 'INITIAL_SURNAME'
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    roll_number TEXT,
    is_ieee_member BOOLEAN DEFAULT FALSE,
    ieee_membership_number TEXT,
    department TEXT,
    photo_consent BOOLEAN DEFAULT TRUE,
    data_privacy_consent BOOLEAN DEFAULT TRUE,
    status registration_status DEFAULT 'REGISTERED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Option 2: Payments Queue
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    amount_pkr NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'Raast', 'Bank Transfer', 'EasyPaisa/JazzCash Manual'
    transaction_id TEXT UNIQUE NOT NULL, -- Enforces duplicate detection
    proof_image_url TEXT NOT NULL, -- Private storage bucket link
    status payment_status DEFAULT 'PENDING',
    verified_by UUID REFERENCES staff_users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Option 2: Tickets & Attendance Check-in
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    ticket_code TEXT UNIQUE NOT NULL, -- Distinct QR ticket code (not certificate code)
    is_used BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES staff_users(id),
    manual_checkin_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Option 2: Certificate Templates
CREATE TABLE certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    background_svg_url TEXT,
    title_text TEXT NOT NULL DEFAULT 'CERTIFICATE OF PARTICIPATION',
    body_template TEXT NOT NULL,
    chair_signature_url TEXT,
    advisor_signature_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Append-Only Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_user_id UUID REFERENCES staff_users(id),
    staff_email TEXT NOT NULL,
    action TEXT NOT NULL, -- 'GENERATE_CODES', 'STAGED_UPLOAD', 'APPROVE_BATCH', 'REVOKE_CERT', 'REPLACE_CERT', 'VERIFY_PAYMENT', 'CHECKIN'
    entity_type TEXT NOT NULL, -- 'certificate', 'payment', 'batch', 'event'
    entity_id TEXT,
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. News & Announcements
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Contact & Enquiry Messages
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_certificates_code ON certificates(code);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_event ON certificates(event_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- -------------------------------------------------------------
-- Security: Row Level Security (RLS)
-- -------------------------------------------------------------
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read active and historical certificate records for verification
CREATE POLICY "Public can verify certificates" ON certificates
    FOR SELECT USING (true);

-- Public can read events and news
CREATE POLICY "Public can view events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Public can view news" ON news
    FOR SELECT USING (true);

-- Only authenticated staff can manage certificates
CREATE POLICY "Staff can manage certificates" ON certificates
    FOR ALL USING (auth.role() = 'authenticated');

-- Audit logs are append-only: no updates or deletes allowed
CREATE POLICY "Audit logs insert only" ON audit_logs
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Audit logs select for authorized staff" ON audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');
