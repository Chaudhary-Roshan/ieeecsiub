# IEEE CS UCET-IUB Platform & Credential Registry

**Official Web Platform, Event Operations & Tamper-Evident Credential Registry**  
*IEEE Computer Society Student Branch Chapter, UCET – The Islamia University of Bahawalpur*  
*Chapter Code:* `CH10992` | *Branch:* `edu.ieee.org/pk-ucetiub`

---

## 🏛️ System Architecture

The IEEE CS UCET-IUB platform is built around a single foundational rule:
> **PostgreSQL on Supabase is the sole source of truth.**  
> Every write operation goes through authenticated Next.js Server Actions and transactional PostgreSQL RPCs. Browser `localStorage` is never used as a primary data store. Public pages are React Server Components that fetch directly from the database and refresh on demand via cache revalidation (`revalidateTag`, `revalidatePath`).

```
                    ┌───────────────────────────────────┐
                    │      Browser (Public / Admin)     │
                    └─────────────────┬─────────────────┘
                                      │
                         HTTPS Request / Server Action
                                      │
                    ┌─────────────────▼─────────────────┐
                    │       Next.js 15 App Router       │
                    │   - Middleware (Auth & Rate Limit)│
                    │   - React Server Components (RSC) │
                    │   - Server Actions (Revalidation) │
                    └─────────────────┬─────────────────┘
                                      │
                    Supabase SSR / Server Admin Client
                                      │
                    ┌─────────────────▼─────────────────┐
                    │      Supabase PostgreSQL DB      │
                    │   - Deny-by-default RLS           │
                    │   - Atomic Multi-step RPCs        │
                    │   - Append-only Audit Logs        │
                    │   - Private Storage Buckets       │
                    └───────────────────────────────────┘
```

---

## 🔐 Security & Access Control

### 1. Role-Based Access Control (RBAC)
Staff accounts are managed via Supabase Auth with TOTP MFA. Roles are stored in `public.staff_roles` and checked via the `has_role(required_role)` `SECURITY DEFINER` function:

| Role | Responsibilities & Capabilities |
| :--- | :--- |
| **`ADMIN`** | Full chapter administration, staff management, template configuration, event lifecycle |
| **`CERTIFICATE_MANAGER`** | Run certificate generation wizard, issue credentials, 24h undo run, revoke, replace |
| **`TREASURER`** | Review payment proofs, verify/reject registration payments, audit transaction IDs |
| **`CHECKIN_STAFF`** | Mobile QR ticket scanner, attendee verification, manual check-in with reason |
| **`CONTENT_EDITOR`** | Manage events, news bulletins, photo galleries, team roster |

### 2. Deny-by-Default Row Level Security (RLS)
- **Public (`anon`)**: Can only read published events (`is_published = true`), team members, and news. Direct `SELECT` on `certificates` is denied; certificates can **only** be queried via the narrow `verify_certificate(cert_code)` RPC.
- **Audit Logs**: The `audit_logs` table has database triggers that revoke `UPDATE` and `DELETE` permissions, guaranteeing an immutable, append-only history.
- **Verification Rate Limiting**: The `/verify/[code]` route is protected by sliding-window rate limiting in middleware to prevent automated scraping and credential enumeration.

---

## 📜 Unified 5-Step Certificate Wizard

The certificate pipeline eliminates separate, desynchronized approval queues in favor of an atomic 5-step wizard located at `/admin/certificates/new`:

1. **Step 1: Select Event** — Pick from upcoming, ongoing, or completed chapter events.
2. **Step 2: Upload Data** — Flexible ingestion:
   - Ingest CSV or Excel files (`.xlsx`, `.xls`, `.csv`).
   - Supports **Person Layout** (`Full Name`, `Email`, `Role`, `Affiliation`) or **Team Layout** (`Team Name`, `Project Title`, `Member 1..N`).
   - One-click sample CSV templates provided.
   - Alternatively, pull confirmed, checked-in participants directly from event registrations.
3. **Step 3: Validate & Preview** — Real-time validation parses recipient names, flags duplicates or missing fields, and shows a full preview before generation.
4. **Step 4: Template Choice** — Choose from 6 responsive, print-ready official certificate templates (Classic Participation, Distinguished Winner, Leadership Recognition, Executive Organizer, Speaker Honor, Workshop Completion).
5. **Step 5: Atomic Generation & 24h Undo** — 
   - Executes inside a single transaction: writes to `certificate_runs`, `certificates`, `certificate_members`, and `certificate_versions`.
   - Generates tamper-evident codes (e.g. `CSIUB-26-XXXX-XXXX`) with checksum validation.
   - One-click CSV download of all generated codes and verification links.
   - **24-Hour Instant Undo**: Run can be voided within 24 hours if a mistake is made, instantly marking all records as `VOID` and preserving the audit log.

### Lifecycle Actions (`/admin/certificates`)
- **Revoke**: Mark a certificate as `REVOKED` with a mandatory reason, immediately reflected on the verification portal.
- **Replace**: Correct misspelled names or details; issues a replacement certificate while pointing the old code to the new record (`REPLACED` status).

---

## 🎟️ Event Operations Lifecycle

### 1. Attendee Registration
- Direct event registration on `/events/[slug]`.
- Atomic seat limits enforced via `SELECT ... FOR UPDATE` row locks in PostgreSQL.
- Registration deadlines and duplicate emails checked in transaction.
- Returns a unique `ticket_code` and a secret `private_token`.

### 2. Attendee Entry Pass Portal (`/my/[token]`)
- Attendees access their self-service pass at `/my/[token]` without needing to create an account.
- Displays live registration status (`PENDING_PAYMENT`, `CONFIRMED`, `WAITLISTED`, `CHECKED_IN`, `CANCELLED`).
- Provides dynamic QR entry pass and ticket summary.
- Allows direct upload of payment proof (screenshot/receipt) for paid workshops.

### 3. Treasurer Payment Queue (`/admin/payments`)
- Displays all pending registrations requiring payment verification.
- Previews payment receipt images directly from secure Supabase storage.
- Prevents duplicate bank or Raast transaction IDs.
- One-click **Verify** (auto-confirms registration and sends email/entry pass) or **Reject** with feedback.

### 4. Multi-Device Check-in Scanner (`/admin/checkin`)
- Mobile-friendly camera barcode/QR scanner designed for registration desks.
- Atomic database check-in via the `check_in` PostgreSQL RPC:
  - Prevents race conditions when multiple staff scan simultaneously.
  - Enforces payment completion (`UNPAID` guard).
  - Flags duplicate scans immediately (`ALREADY_CHECKED_IN`).
- Live counters for Total Registered, Confirmed, Checked-in, and Attendance Rate.

### 5. IEEE vTools Export (`/admin/vtools-export`)
- Generates compliant CSV exports formatted for IEEE vTools Meeting Reporting (L31 form).
- Automatically categorizes attendees into IEEE Members vs. Non-Members/Guests.

---

## 🎨 IEEE CS Brand Identity & Styling

Built in strict compliance with the **IEEE Computer Society Brand Identity & Graphic Style Guide**:

| Palette | Colour Name | Hex Code | Usage Guidelines |
| :--- | :--- | :--- | :--- |
| **Primary** | IEEE Blue (PMS 3015) | `#00629B` | White text (6.5:1 contrast) |
| **Accent (~10%)** | CS Orange (PMS 137 C) | `#FFA300` | **Dark / Black text ONLY** (10.5:1 contrast) |
| **Dark Neutral** | Navy (PMS 295) | `#002855` | White text (14.6:1 contrast) |
| **Highlight** | Process Cyan | `#00B5E2` | Navy text (6.1:1 contrast) |
| **Status: Active** | IEEE Green (PMS 348 C) | `#00843D` | Light green tint background |
| **Status: Revoked**| Crimson Red (PMS 200 C) | `#BA0C2F` | Light red tint background |
| **Status: Replaced**| Dark Orange (PMS 158 C)| `#E87722` | Light amber tint background |

**Typography**: Montserrat for headlines, navigation, and pill badges; Open Sans for body copy.

---

## 🛠️ Environment Setup & Configuration

Create a `.env.local` file in the project root:

```env
# Supabase Project URL & Anon Key
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Supabase Service Role Key (Guarded on Server Only)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Optional App URL override (for production emails & links)
NEXT_PUBLIC_APP_URL=https://ieeecsiub.vercel.app
```

---

## 🚀 Development & Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
Migrations are located in `supabase/migrations/`:
- `20261031130000_phase0_lockdown_rls.sql`: Deny-by-default RLS lockdown
- `20261031140000_phase1_foundation.sql`: RBAC, storage buckets, audit logs, verify RPC
- `20261031150000_phase4_operations.sql`: Event registrations, payments, atomic check-in RPCs

Apply migrations via the Supabase CLI or the Supabase SQL Editor.

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the site.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📜 Disclaimers & Compliance

- **Issuer Statement:** *"This is a chapter recognition, not an IEEE credential."*
- **Central Credentialing:** Official IEEE CEU/PDH continuing education units are issued solely through the central IEEE Credentialing Program. Chapter certificates acknowledge participation, volunteer service, and local project achievements.
- **Verification Portal:** Public verification at `/verify` and `/verify/[code]` provides sub-second confirmation of authenticity directly from the chapter's PostgreSQL registry.
