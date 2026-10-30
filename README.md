# IEEE CS UCET-IUB Chapter Web Platform & Credential Registry

**Official Website & Dual-Pathway Certificate Issuance System**  
*IEEE Computer Society Student Branch Chapter, UCET – The Islamia University of Bahawalpur*  
*Author:* Muhammad Roshan Ashraf | *Date:* Oct 30, 2026

---

## 🏛️ System Overview

This platform implements a dual-pathway certificate verification architecture for the IEEE Computer Society Student Branch Chapter at University College of Engineering & Technology (UCET), The Islamia University of Bahawalpur:

- **Option 1: Certificate Registry (Phase 1):** Offline-designed certificates (Canva, Word, Photoshop) are registered by uploading participant lists. Random tamper-evident codes (`CSIUB-26-XXXX-XXXX`) and QR codes are generated. Batches are staged and require mandatory dual-officer approval before publishing.
- **Option 2: In-site Generation (Phase 2):** Complete end-to-end event management inside the site. Students register without an account, upload payment receipts (Raast/Bank transfer) for Treasurer reconciliation, receive QR tickets, check in via mobile scanner, and get automated PDF certificates if they meet published eligibility rules.
- **Unified Public Verification (`/verify` & `/verify/[code]`):** Both options converge on the identical verification portal with sub-second response times, status badges (`ACTIVE`, `REVOKED`, `REPLACED`), and optional SHA-256 PDF cryptographic fingerprint checking.

---

## 🎨 Visual Design & IEEE CS Brand Identity

Built in strict compliance with the **IEEE Computer Society Brand Identity & Graphic Style Guide**:

| Role | Colour | Hex | Typography / Contrast |
| :--- | :--- | :--- | :--- |
| **Main** | IEEE Blue (PMS 3015) | `#00629B` | White text (6.5:1 ratio) |
| **Accent (~10%)** | CS Orange (PMS 137 C) | `#FFA300` | **Black text ONLY** (10.5:1 ratio, never white) |
| **Dark** | Navy (PMS 295) | `#002855` | White text (14.6:1 ratio) |
| **Highlight** | Process Cyan | `#00B5E2` | Navy text (6.1:1 ratio) |
| **Active Status** | Green (PMS 348 C) | `#00843D` | Light tint bg with dark text |
| **Revoked Status**| Red (PMS 200 C) | `#BA0C2F` | Light tint bg with dark text |
| **Replaced Status**| Dark Orange (PMS 158 C)| `#E87722` | Light tint bg with dark text |
| **Not Found** | Cool Gray 9 C | `#75787B` | Neutral tint bg |

**Typography:** Montserrat (Headings, Navigation, Pill buttons) & Open Sans (Body paragraphs).

---

## 📂 Architecture & Directory Structure

```
├── supabase/
│   └── schema.sql                  # Production PostgreSQL schema with RLS and Audit Triggers
├── src/
│   ├── app/
│   │   ├── page.tsx                # Homepage (Hero, Stats band, 3 cards, upcoming & completed events)
│   │   ├── about/page.tsx          # Affiliation, Parent Branch (edu.ieee.org/pk-ucetiub), Hierarchy
│   │   ├── team/page.tsx           # Advisors (Dr. Asjad Amin, Dr. Aoun Muhammad, Muhammad Roshan Ashraf)
│   │   ├── events/page.tsx         # Event tabs (Upcoming, Ongoing, Completed, Postponed, Cancelled)
│   │   ├── events/[slug]/page.tsx  # Permanent event links, guest signup & Raast payment proof upload
│   │   ├── membership/page.tsx     # 2 Separated columns: Local Free Participation vs. Paid IEEE CS
│   │   ├── verify/page.tsx         # Unified Certificate Verification search & QR landing
│   │   ├── verify/[code]/page.tsx  # Dynamic record page (Active / Revoked / Replaced / Not found)
│   │   ├── contact/page.tsx        # Chapter location, enquiries with CAPTCHA, verification desk
│   │   ├── policy/page.tsx         # Certificate policy, 3 recognition levels, issuer statements
│   │   ├── privacy/page.tsx        # GDPR-aligned student data privacy policy
│   │   ├── news/page.tsx           # Bulletins and technical reports
│   │   ├── gallery/page.tsx        # Event photo galleries
│   │   ├── resources/page.tsx      # Lecture slides and workshop starter repositories
│   │   └── admin/                  # Staff Console (2FA Protected)
│   │       ├── page.tsx            # Executive Dashboard
│   │       ├── registry/page.tsx   # Option 1: Code generator, QR zip export, staged upload & approval
│   │       ├── certificates/page.tsx # Revoke with reason, replace misspelled names, legacy import
│   │       ├── payments/page.tsx   # Option 2: Treasurer queue, duplicate TX ID detection
│   │       ├── checkin/page.tsx    # Option 2: Mobile attendance QR scanner with duplicate warning
│   │       ├── issuance/page.tsx   # Option 2: Automated eligibility check & batch PDF generation
│   │       ├── vtools-export/page.tsx # vTools Meeting (L31) Member vs Guest attendance CSV export
│   │       ├── audit/page.tsx      # Append-only immutable audit trail
│   │       └── login/page.tsx      # Staff 2FA Login simulator
│   ├── components/                 # Reusable UI components & layouts
│   └── lib/
│       ├── codeGenerator.ts        # CSIUB-26 random codes with Luhn-style mod-36 checksum
│       ├── certificatePdf.ts       # jsPDF vector landscape A4 certificate renderer
│       ├── sha256.ts               # WebCrypto SHA-256 fingerprint hashing & PKT time formatters
│       ├── db.ts                   # Local/Browser storage state manager with seed records
│       └── constants.ts            # Brand colors, IEEE hierarchy & leadership directory
└── tests/
    └── verify-system.mjs           # Unit test suite verifying checksums, PKT times, and rules
```

---

## 🚀 Running the Project

### 1. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run Test Suite
```bash
node tests/verify-system.mjs
```

### 3. Production Build
```bash
npm run build
npm start
```

---

## 🔐 Administrative Access & Role Separation

Students never create accounts. Chapter staff log in via `/admin/login` with Two-Factor Authentication (2FA).

| Role | Edit Content | Generate Codes | Upload CSV | Approve Batches | Revoke / Replace | Verify Payments |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Site Admin** | Yes | Yes | Yes | **NO** | **NO** | Yes |
| **Content Manager** | Yes | Yes | Yes | **NO** | **NO** | No |
| **Certificate Approver** | No | Yes | No | **YES** | **YES** | No |
| **Treasurer** | No | No | No | **NO** | **NO** | **YES** |
| **Check-in Staff** | No | No | No | **NO** | **NO** | No |

*Separation of Powers:* The Site Admin cannot approve certificates. Uploaded batches remain staged until authorized by the designated Certificate Approver (Dr. Aoun Muhammad / Faculty Advisor).

---

## 📜 Compliance & Disclaimers

- **Issuer Statement:** *"This is a chapter recognition, not an IEEE credential."*
- **Central Credentialing:** IEEE CEU/PDH credentials are issued solely through the IEEE Credentialing Program. Chapter certificates acknowledge participation and local project achievements.
