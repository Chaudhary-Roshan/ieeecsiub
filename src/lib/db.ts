import {
  CertificateRecord,
  EventItem,
  TeamMember,
  UploadBatch,
  Registration,
  PaymentProof,
  AuditLogItem,
  StaffUser,
  CertificateTemplate,
  AttendanceRecord,
  EventTeam,
  ChapterSettings
} from "@/types";
import { INITIAL_STAFF_USERS, CHAPTER_INFO, DEFAULT_CHAPTER_SETTINGS } from "./constants";
import { getSupabase } from "./supabase";
import { clearEventDataAction, wipeAllCertificatesAction, wipeEventCredentialsOnlyAction } from "@/app/actions/operations";
import { bulkSaveCertificatesAction, verifyCertificateAction } from "@/app/actions/certificates";
import { DEFAULT_CERTIFICATE_HTML } from "./defaultCertificateHtml";
import {
  TEMPLATE_DESIGN1_SIMPLE,
  TEMPLATE_DESIGN2_BLUE_PANEL,
  TEMPLATE_DESIGN3_CENTERED,
  TEMPLATE_SERIES1_VOLUNTEER,
  TEMPLATE_EXPO_WINNER_MEMBERS,
  TEMPLATE_EXPO_PARTICIPATION_MEMBERS,
} from "./certificateTemplates";
import { DIGITALFEST_PARTICIPANTS, DIGITALFEST_REGISTRATIONS, DIGITALFEST_TEAMS } from "./digitalFestData";
import { normalizeVerificationCode } from "./codeGenerator";
import { parseLearningObjectives } from "./sha256";

// Seed Templates
const SEED_TEMPLATES: CertificateTemplate[] = [
  {
    id: "tpl-default",
    name: "Official IEEE CS Navy & Gold Border (Default)",
    description: "Classic prestigious layout with double gold ornamental border, chapter badge, and QR verification",
    htmlContent: DEFAULT_CERTIFICATE_HTML,
    isDefault: true,
    createdAt: "2026-10-30T00:00:00Z",
  },
  {
    id: "tpl-design1-simple",
    name: "Design 1 — Simple Side Bar (Participation)",
    description: "Clean layout with IEEE CS vertical navy bar, orange accent, and geometric corner markers",
    htmlContent: TEMPLATE_DESIGN1_SIMPLE,
    isDefault: false,
    createdAt: "2026-10-31T00:00:00Z",
  },
  {
    id: "tpl-design2-blue-panel",
    name: "Design 2 — Blue Angled Panel",
    description: "Modern angled dual-layer polygon side panel with binary watermark and dual accent underlines",
    htmlContent: TEMPLATE_DESIGN2_BLUE_PANEL,
    isDefault: false,
    createdAt: "2026-10-31T00:00:00Z",
  },
  {
    id: "tpl-design3-centered",
    name: "Design 3 — Centered with Binary Band",
    description: "Signature centered layout with bottom binary wave and dark navy verification block",
    htmlContent: TEMPLATE_DESIGN3_CENTERED,
    isDefault: false,
    createdAt: "2026-10-31T00:00:00Z",
  },
  {
    id: "tpl-series1-volunteer",
    name: "Series 1 — Volunteer Appreciation",
    description: "Volunteer recognition with gold/navy heart seal medal and binary wave",
    htmlContent: TEMPLATE_SERIES1_VOLUNTEER,
    isDefault: false,
    createdAt: "2026-10-31T00:00:00Z",
  },
  {
    id: "tpl-expo-winner-members",
    name: "Projects Expo — Winner Award (with Team Members)",
    description: "Prestigious gold medal ribbon, project title, and team member badges",
    htmlContent: TEMPLATE_EXPO_WINNER_MEMBERS,
    isDefault: false,
    createdAt: "2026-10-31T00:00:00Z",
  },
  {
    id: "tpl-expo-participation-members",
    name: "Projects Expo — Participation (with Team Members)",
    description: "Hardware microchip emblem, project title, and team member badges",
    htmlContent: TEMPLATE_EXPO_PARTICIPATION_MEMBERS,
    isDefault: false,
    createdAt: "2026-10-31T00:00:00Z",
  },
];

// Initial stores are empty by default; data is fetched exclusively from Supabase
const SEED_EVENTS: EventItem[] = [];
const SEED_CERTIFICATES: CertificateRecord[] = [];
const SEED_TEAM: TeamMember[] = [];
const SEED_BATCHES: UploadBatch[] = [];
const SEED_REGISTRATIONS: Registration[] = [];
const SEED_PAYMENTS: PaymentProof[] = [];
const SEED_AUDIT: AuditLogItem[] = [];

// Helper to access LocalStorage safely in Next.js
class ChapterDatabase {
  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  purgeAllTestData(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem("ieee_cs_certificates");
      localStorage.removeItem("ieee_cs_batches");
      localStorage.removeItem("ieee_cs_registrations");
      localStorage.removeItem("ieee_cs_payments");
      localStorage.removeItem("ieee_cs_audit");
      localStorage.removeItem("ieee_cs_attendance");
      localStorage.removeItem("ieee_cs_attendance_records");
      localStorage.removeItem("ieee_cs_events");
      localStorage.removeItem("ieee_cs_team");
      localStorage.removeItem("ieee_cs_certificate_templates");
      localStorage.setItem("ieee_cs_cache_version", "v6_clean_prod");
    } catch (e) {
      console.error("Purge error:", e);
    }
  }

  private getItem<T>(key: string, fallback: T): T {
    if (!this.isBrowser()) return fallback;
    try {
      const data = localStorage.getItem(`ieee_cs_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(`ieee_cs_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }

  // --- Certificates & Verified QR Credentials ---
  getCertificates(): CertificateRecord[] {
    const list = this.getItem<CertificateRecord[]>("certificates", []);
    const certMap = new Map<string, CertificateRecord>();

    // 1. Add explicitly saved certificates
    if (Array.isArray(list)) {
      list.forEach((c) => {
        if (c && c.code) certMap.set(c.code.trim().toUpperCase(), c);
      });
    }

    // 2. Automatically harvest all active issued credentials from attendance sheets
    const attendanceRecords = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    const events = this.getEvents();
    const eventMap = new Map<string, EventItem>();
    events.forEach((ev) => eventMap.set(ev.id, ev));

    Object.entries(attendanceRecords).forEach(([eventId, records]) => {
      const event = eventMap.get(eventId);
      if (Array.isArray(records)) {
        records.forEach((rec) => {
          if (rec.certificateCode) {
            const cleanCode = rec.certificateCode.trim().toUpperCase();
            if (!certMap.has(cleanCode)) {
              certMap.set(cleanCode, {
                id: `cert-${rec.id || cleanCode}`,
                code: cleanCode,
                recipientName: rec.name || "Participant",
                recipientRollNumber: rec.rollNumber || undefined,
                recipientEmail: rec.email || undefined,
                publicNameFormat: "FULL_NAME",
                eventId: eventId,
                eventTitle: event?.title || "UCET IUB Technical Event",
                certificateType: event?.certificateType || "Certificate of Participation",
                recognitionLevel: "CHAPTER_RECOGNITION",
                issuerStatement: "In recognition of active participation and successful completion.",
                activityDate: event?.startDate ? event.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
                issueDate: rec.checkedInAt ? rec.checkedInAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
                approverName: "Muhammad Roshan Ashraf",
                approverRole: "Chapter Chair",
                status: "ACTIVE",
                source: "IN_SITE_GENERATED",
                createdAt: rec.checkedInAt || new Date().toISOString(),
              });
            } else {
              // Ensure roll number and email are populated if missing
              const existing = certMap.get(cleanCode)!;
              if (!existing.recipientRollNumber && rec.rollNumber) existing.recipientRollNumber = rec.rollNumber;
              if (!existing.recipientEmail && rec.email) existing.recipientEmail = rec.email;
            }
          }
        });
      }
    });

    const combined = Array.from(certMap.values()).filter(
      (c) =>
        c &&
        c.code &&
        !c.code.startsWith("TEST-") &&
        !c.code.includes("TEST") &&
        c.recipientName !== "Test Name" &&
        c.recipientName !== "Safe Attendee"
    );
    return combined;
  }

  getCertificateByCode(query: string): CertificateRecord | undefined {
    if (!query) return undefined;
    const list = this.getCertificates();
    const clean = normalizeVerificationCode(query);
    const cleanAlpha = clean.replace(/[^A-Z0-9]/g, "");

    // 1. Exact code match
    let match = list.find((c) => c.code && c.code.trim().toUpperCase() === clean);
    if (match) return match;

    // 2. Alphanumeric stripped code match (ignoring dashes, spaces)
    if (cleanAlpha.length >= 8) {
      match = list.find((c) => {
        if (!c.code) return false;
        const cAlpha = c.code.replace(/[^A-Z0-9]/g, "").toUpperCase();
        return cAlpha === cleanAlpha;
      });
      if (match) return match;
    }

    // 3. Roll number match
    match = list.find((c) => {
      if (!c.recipientRollNumber) return false;
      const rClean = c.recipientRollNumber.trim().toUpperCase();
      if (rClean === clean) return true;
      const rAlpha = rClean.replace(/[^A-Z0-9]/g, "");
      return rAlpha.length >= 4 && rAlpha === cleanAlpha;
    });
    if (match) return match;

    // 4. Email match
    const queryLower = query.trim().toLowerCase();
    if (queryLower.includes("@")) {
      match = list.find((c) => c.recipientEmail?.trim().toLowerCase() === queryLower);
      if (match) return match;
    }

    // 5. Direct search in attendance_records as fallback
    const attendanceRecords = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    for (const [eventId, records] of Object.entries(attendanceRecords)) {
      if (Array.isArray(records)) {
        for (const rec of records) {
          if (!rec.certificateCode) continue;
          const recCode = rec.certificateCode.trim().toUpperCase();
          const recRoll = (rec.rollNumber || "").trim().toUpperCase();
          const recEmail = (rec.email || "").trim().toLowerCase();
          const recAlpha = recCode.replace(/[^A-Z0-9]/g, "");

          if (
            recCode === clean ||
            (cleanAlpha.length >= 8 && recAlpha === cleanAlpha) ||
            (recRoll && recRoll === clean) ||
            (recRoll && cleanAlpha.length >= 4 && recRoll.replace(/[^A-Z0-9]/g, "") === cleanAlpha) ||
            (recEmail && queryLower.includes("@") && recEmail === queryLower)
          ) {
            const events = this.getEvents();
            const ev = events.find((e) => e.id === eventId);
            return {
              id: `cert-${rec.id || recCode}`,
              code: recCode,
              recipientName: rec.name || "Participant",
              recipientRollNumber: rec.rollNumber || undefined,
              recipientEmail: rec.email || undefined,
              publicNameFormat: "FULL_NAME",
              eventId: eventId,
              eventTitle: ev?.title || "UCET IUB Technical Event",
              certificateType: ev?.certificateType || "Certificate of Participation",
              recognitionLevel: "CHAPTER_RECOGNITION",
              issuerStatement: "In recognition of active participation and successful completion.",
              activityDate: ev?.startDate ? ev.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
              issueDate: rec.checkedInAt ? rec.checkedInAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
              approverName: "Muhammad Roshan Ashraf",
              approverRole: "Chapter Chair",
              status: "ACTIVE",
              source: "IN_SITE_GENERATED",
              createdAt: rec.checkedInAt || new Date().toISOString(),
            };
          }
        }
      }
    }

    return undefined;
  }

  async fetchCertificateWithStatus(query: string): Promise<{
    certificate: CertificateRecord | null;
    status: "FOUND" | "NOT_FOUND" | "ERROR";
    error?: string;
  }> {
    if (!query) return { certificate: null, status: "NOT_FOUND" };
    const clean = normalizeVerificationCode(query);
    const client = getSupabase();
    let networkOrDbError: string | null = null;
    let queryExecutedSuccessfully = false;

    if (client) {
      try {
        // First try the secure verification RPC which works under anon RLS
        const { data: rpcData, error: rpcError } = await client.rpc("verify_certificate", {
          cert_code: clean,
        });

        if (rpcError) {
          if (rpcError.code !== "PGRST202") {
            networkOrDbError = rpcError.message;
          }
        } else if (rpcData) {
          queryExecutedSuccessfully = true;
          if (rpcData.found) {
            const mapped: CertificateRecord = {
              id: rpcData.code,
              code: rpcData.code,
              recipientName: rpcData.recipient_name || rpcData.recipientName,
              recipientRollNumber: rpcData.recipient_roll_number || rpcData.recipientRollNumber || rpcData.roll_number || undefined,
              recipientEmail: rpcData.recipient_email || rpcData.recipientEmail || rpcData.email || undefined,
              publicNameFormat: "FULL_NAME",
              eventId: "",
              eventTitle: rpcData.event_name || rpcData.event_title || "IEEE Technical Session",
              certificateType: rpcData.certificate_type || "Certificate of Participation",
              recognitionLevel: (rpcData.recognition_level as any) || "CHAPTER_RECOGNITION",
              partnerName: rpcData.partner_name || undefined,
              issuerStatement: rpcData.issuer_statement || CHAPTER_INFO.issuerStatementDefault,
              activityDate: rpcData.event_date || "",
              issueDate: rpcData.issue_date || "",
              approverName: rpcData.approver_name || "Chapter Chair",
              approverRole: rpcData.approver_role || "Chapter Chair",
              status: rpcData.status || "ACTIVE",
              source: "IN_SITE_GENERATED",
              templateId: rpcData.template_id || undefined,
              teamName: rpcData.team_name || undefined,
              projectTitle: rpcData.project_title || undefined,
              replacedByCode: rpcData.replaced_by_code || undefined,
              replacementReason: rpcData.replacement_reason || undefined,
              revocationDate: rpcData.revocation_date || undefined,
              revocationReason: rpcData.revocation_reason || undefined,
              sha256Fingerprint: rpcData.sha256_hash || undefined,
              createdAt: rpcData.issue_date || new Date().toISOString(),
            };
            return { certificate: mapped, status: "FOUND" };
          }
        }

        // Direct select fallback by code
        const { data, error } = await client
          .from("certificates")
          .select("*")
          .eq("code", clean)
          .maybeSingle();

        if (error) {
          networkOrDbError = error.message;
        } else {
          queryExecutedSuccessfully = true;
          if (data) {
            const mapped: CertificateRecord = {
              id: data.id,
              code: data.code,
              recipientName: data.recipient_name,
              recipientRollNumber: data.recipient_roll_number || data.roll_number || undefined,
              recipientEmail: data.recipient_email || data.email || undefined,
              publicNameFormat: (data.public_name_format as any) || "FULL_NAME",
              eventId: data.event_id || "",
              eventTitle: data.event_title || data.event_name || "IEEE Technical Session",
              certificateType: data.certificate_type || "Certificate of Participation",
              recognitionLevel: (data.recognition_level as any) || "CHAPTER_RECOGNITION",
              issuerStatement: data.issuer_statement || CHAPTER_INFO.issuerStatementDefault,
              activityDate: data.activity_date || data.event_date || "",
              issueDate: data.issue_date || "",
              approverName: data.approver_name || "Chapter Chair",
              approverRole: data.approver_role || "Chapter Chair",
              status: data.status,
              source: data.source || "IN_SITE_GENERATED",
              batchId: data.batch_id,
              templateId: data.template_id || undefined,
              teamName: data.team_name || undefined,
              projectTitle: data.project_title || undefined,
              replacedByCode: data.replaced_by_code,
              replacementReason: data.replacement_reason,
              revocationDate: data.revocation_date || data.revoked_at,
              revocationReason: data.revocation_reason || data.revoke_reason,
              sha256Fingerprint: data.sha256_fingerprint || data.sha256_hash,
              pdfUrl: data.pdf_url,
              createdAt: data.created_at || new Date().toISOString(),
            };

            // Enrich with team / project expo metadata if matched
            const dfMatch = DIGITALFEST_PARTICIPANTS.find(
              (p) => p.certificateCode.toUpperCase() === mapped.code.toUpperCase() || p.name.toLowerCase() === mapped.recipientName.toLowerCase()
            );
            if (dfMatch) {
              if (!mapped.teamName) mapped.teamName = dfMatch.teamName;
              if (!mapped.projectTitle) mapped.projectTitle = dfMatch.projectTitle;
              const teamMatch = DIGITALFEST_TEAMS.find((t) => t.teamName.toLowerCase() === dfMatch.teamName.toLowerCase());
              if (teamMatch) {
                if (!mapped.teamMembers) mapped.teamMembers = teamMatch.members;
                if (!mapped.projectDomain) mapped.projectDomain = `${teamMatch.semester} Semester`;
              }
            }

            const localMatch = this.getCertificates().find((c) => c.code.toUpperCase() === clean);
            if (localMatch) {
              if (!mapped.teamName && localMatch.teamName) mapped.teamName = localMatch.teamName;
              if (!mapped.projectTitle && localMatch.projectTitle) mapped.projectTitle = localMatch.projectTitle;
              if (!mapped.teamMembers && localMatch.teamMembers) mapped.teamMembers = localMatch.teamMembers;
              if (!mapped.projectDomain && localMatch.projectDomain) mapped.projectDomain = localMatch.projectDomain;
            }

            return { certificate: mapped, status: "FOUND" };
          }
        }

        // Search by email or roll number if query looks like one
        const queryLower = query.trim().toLowerCase();
        if (queryLower.includes("@")) {
          const { data: emailData, error: emailError } = await client
            .from("certificates")
            .select("*")
            .ilike("recipient_email", queryLower)
            .maybeSingle();
          if (emailData && !emailError) {
            return {
              certificate: {
                id: emailData.id,
                code: emailData.code,
                recipientName: emailData.recipient_name,
                recipientRollNumber: emailData.recipient_roll_number || emailData.roll_number || undefined,
                recipientEmail: emailData.recipient_email || emailData.email || undefined,
                publicNameFormat: (emailData.public_name_format as any) || "FULL_NAME",
                eventId: emailData.event_id || "",
                eventTitle: emailData.event_title || emailData.event_name || "IEEE Technical Session",
                certificateType: emailData.certificate_type || "Certificate of Participation",
                recognitionLevel: (emailData.recognition_level as any) || "CHAPTER_RECOGNITION",
                issuerStatement: emailData.issuer_statement || CHAPTER_INFO.issuerStatementDefault,
                activityDate: emailData.activity_date || emailData.event_date || "",
                issueDate: emailData.issue_date || "",
                approverName: emailData.approver_name || "Chapter Chair",
                approverRole: emailData.approver_role || "Chapter Chair",
                status: emailData.status,
                source: emailData.source || "IN_SITE_GENERATED",
                createdAt: emailData.created_at || new Date().toISOString(),
              },
              status: "FOUND",
            };
          }
        } else if (clean.length >= 4) {
          const { data: rollData, error: rollError } = await client
            .from("certificates")
            .select("*")
            .ilike("recipient_roll_number", clean)
            .maybeSingle();
          if (rollData && !rollError) {
            return {
              certificate: {
                id: rollData.id,
                code: rollData.code,
                recipientName: rollData.recipient_name,
                recipientRollNumber: rollData.recipient_roll_number || rollData.roll_number || undefined,
                recipientEmail: rollData.recipient_email || rollData.email || undefined,
                publicNameFormat: (rollData.public_name_format as any) || "FULL_NAME",
                eventId: rollData.event_id || "",
                eventTitle: rollData.event_title || rollData.event_name || "IEEE Technical Session",
                certificateType: rollData.certificate_type || "Certificate of Participation",
                recognitionLevel: (rollData.recognition_level as any) || "CHAPTER_RECOGNITION",
                issuerStatement: rollData.issuer_statement || CHAPTER_INFO.issuerStatementDefault,
                activityDate: rollData.activity_date || rollData.event_date || "",
                issueDate: rollData.issue_date || "",
                approverName: rollData.approver_name || "Chapter Chair",
                approverRole: rollData.approver_role || "Chapter Chair",
                status: rollData.status,
                source: rollData.source || "IN_SITE_GENERATED",
                createdAt: rollData.created_at || new Date().toISOString(),
              },
              status: "FOUND",
            };
          }
        }
      } catch (err: any) {
        console.warn("Supabase fetchCertificateWithStatus error:", err);
        networkOrDbError = err?.message || String(err);
      }
    }

    // Fallback to Server Action to verify against live database with full server session
    try {
      const saResult = await verifyCertificateAction(clean);
      if (saResult) return { certificate: saResult, status: "FOUND" };
      queryExecutedSuccessfully = true;
    } catch (saErr: any) {
      console.warn("verifyCertificateAction server action notice:", saErr);
      if (!networkOrDbError) {
        networkOrDbError = saErr?.message || String(saErr);
      }
    }

    const localCert = this.getCertificateByCode(clean) || this.getCertificateByCode(query);
    if (localCert) {
      return { certificate: localCert, status: "FOUND" };
    }

    // If a database error or network failure prevented verifying, report ERROR
    if (networkOrDbError && !queryExecutedSuccessfully) {
      return { certificate: null, status: "ERROR", error: networkOrDbError };
    }

    return { certificate: null, status: "NOT_FOUND" };
  }

  async fetchCertificateByCode(query: string): Promise<CertificateRecord | undefined> {
    const res = await this.fetchCertificateWithStatus(query);
    return res.certificate || undefined;
  }

  async fetchCertificates(): Promise<CertificateRecord[]> {
    const localCerts = this.getCertificates();
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("certificates")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          const list: CertificateRecord[] = data.map((d: any) => ({
            id: d.id,
            code: d.code,
            recipientName: d.recipient_name,
            recipientRollNumber: d.recipient_roll_number || d.roll_number || undefined,
            recipientEmail: d.recipient_email || d.email || undefined,
            publicNameFormat: (d.public_name_format as any) || "FULL_NAME",
            eventId: d.event_id || "",
            eventTitle: d.event_title || "",
            certificateType: d.certificate_type,
            recognitionLevel: (d.recognition_level as any) || "CHAPTER_RECOGNITION",
            issuerStatement: d.issuer_statement || CHAPTER_INFO.issuerStatementDefault,
            activityDate: d.activity_date,
            issueDate: d.issue_date,
            approverName: d.approver_name,
            approverRole: d.approver_role,
            status: d.status,
            source: d.source || "UPLOAD_REGISTRY",
            templateId: d.template_id || undefined,
            teamName: d.team_name || undefined,
            projectTitle: d.project_title || undefined,
            replacedByCode: d.replaced_by_code,
            replacementReason: d.replacement_reason,
            revocationDate: d.revocation_date,
            revocationReason: d.revocation_reason,
            sha256Fingerprint: d.sha256_fingerprint,
            pdfUrl: d.pdf_url,
            createdAt: d.created_at,
          }));

          const cleanList = list.filter(
            (c) =>
              c.code &&
              !c.code.startsWith("TEST-") &&
              !c.code.includes("TEST") &&
              c.recipientName !== "Test Name" &&
              c.recipientName !== "Safe Attendee"
          );

          const cleanLocal = localCerts.filter(
            (c) =>
              c.code &&
              !c.code.startsWith("TEST-") &&
              !c.code.includes("TEST") &&
              c.recipientName !== "Test Name" &&
              c.recipientName !== "Safe Attendee"
          );

          const mergedMap = new Map<string, CertificateRecord>();
          cleanLocal.forEach((c) => mergedMap.set(c.code.toUpperCase(), c));
          cleanList.forEach((c) => mergedMap.set(c.code.toUpperCase(), c));

          const cleanMerged = Array.from(mergedMap.values());
          this.setItem("certificates", cleanMerged);
          return cleanMerged;
        }
      } catch (err) {
        console.warn("Supabase fetchCertificates error:", err);
      }
    }
    // Also try saving any unsaved local certificates if cloud was unreachable earlier
    if (localCerts.length > 0) {
      bulkSaveCertificatesAction(localCerts).catch(() => {});
    }
    return localCerts;
  }

  async addCertificate(cert: CertificateRecord): Promise<{ success: boolean; cloudSaved: boolean; count: number; error?: string }> {
    return this.addCertificatesBulk([cert]);
  }

  async addCertificatesBulk(certs: CertificateRecord[]): Promise<{ success: boolean; cloudSaved: boolean; count: number; error?: string }> {
    if (!certs || certs.length === 0) return { success: true, cloudSaved: true, count: 0 };
    const list = this.getCertificates();
    const map = new Map<string, CertificateRecord>();
    certs.forEach((c) => {
      if (c && c.code) map.set(c.code.trim().toUpperCase(), c);
    });

    const remaining = list.filter((c) => !map.has(c.code.trim().toUpperCase()));
    const combined = [...Array.from(map.values()), ...remaining];
    this.setItem("certificates", combined);

    let cloudSaved = false;
    let cloudError: string | undefined;

    const client = getSupabase();
    if (client) {
      try {
        const payload = certs.map((cert) => {
          const cleanCode = cert.code.trim().toUpperCase();
          return {
            code: cleanCode,
            recipient_name: cert.recipientName || "Participant",
            recipient_roll_number: cert.recipientRollNumber ? cert.recipientRollNumber.trim().toUpperCase() : null,
            recipient_email: cert.recipientEmail || null,
            public_name_format: cert.publicNameFormat || "FULL_NAME",
            event_id: cert.eventId || null,
            event_title: cert.eventTitle || "UCET IUB Technical Session",
            certificate_type: cert.certificateType || "Certificate of Participation",
            recognition_level: cert.recognitionLevel || "CHAPTER_RECOGNITION",
            issuer_statement: cert.issuerStatement || CHAPTER_INFO.issuerStatementDefault,
            activity_date: cert.activityDate || new Date().toISOString().slice(0, 10),
            issue_date: cert.issueDate || new Date().toISOString().slice(0, 10),
            approver_name: cert.approverName || "Muhammad Roshan Ashraf",
            approver_role: cert.approverRole || "Chapter Chair",
            status: cert.status || "ACTIVE",
            source: cert.source || "IN_SITE_GENERATED",
            replaced_by_code: cert.replacedByCode || null,
            replacement_reason: cert.replacementReason || null,
            revocation_date: cert.revocationDate || null,
            revocation_reason: cert.revocationReason || null,
            sha256_fingerprint: cert.sha256Fingerprint || null,
            pdf_url: cert.pdfUrl || null,
          };
        });

        // 1. Try high-performance bulk RPC first
        const rpcPromise = client.rpc("bulk_save_certificates", { p_certs: payload });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("RPC Timeout")), 8000));
        
        try {
          const { data: rpcRes, error: rpcErr } = await (Promise.race([rpcPromise, timeoutPromise]) as Promise<any>);
          if (!rpcErr && rpcRes && rpcRes.success) {
            cloudSaved = true;
          } else if (rpcErr) {
            cloudError = rpcErr.message;
          }
        } catch (e: any) {
          cloudError = e?.message;
        }

        // 2. Direct upsert fallback in batches of 50 if RPC not yet installed or failed
        if (!cloudSaved) {
          let batchFails = 0;
          for (let i = 0; i < payload.length; i += 50) {
            const chunk = payload.slice(i, i + 50);
            let { error: upsertErr } = await client.from("certificates").upsert(chunk, { onConflict: "code" });
            if (upsertErr && (upsertErr.message.includes("column") || upsertErr.message.includes("schema cache"))) {
              const safeChunk = chunk.map(({ template_id, team_name, project_title, ...rest }: any) => rest);
              const retry = await client.from("certificates").upsert(safeChunk, { onConflict: "code" });
              upsertErr = retry.error;
            }
            if (upsertErr) {
              batchFails++;
              cloudError = upsertErr.message;
              console.warn("Supabase certificate sync batch notice:", upsertErr.message);
            }
          }
          if (batchFails === 0 && payload.length > 0) {
            cloudSaved = true;
            cloudError = undefined;
          }
        }

        // 3. Guaranteed Server Action fallback if direct client was blocked
        if (!cloudSaved) {
          try {
            const saRes = await bulkSaveCertificatesAction(certs);
            if (saRes && saRes.success) {
              cloudSaved = true;
              cloudError = undefined;
            } else if (saRes && !saRes.success) {
              cloudError = saRes.error || cloudError;
            }
          } catch (saErr: any) {
            console.warn("Server action certificate bulk save error:", saErr);
            cloudError = saErr?.message || cloudError;
          }
        }
      } catch (err: any) {
        cloudError = err?.message || String(err);
        console.warn("Supabase addCertificatesBulk notice:", err);
      }
    }
    return { success: cloudSaved, cloudSaved, count: certs.length, error: cloudError };
  }

  async updateCertificate(code: string, updates: Partial<CertificateRecord>): Promise<boolean> {
    const list = this.getCertificates();
    const clean = code.trim().toUpperCase();
    const targetCode = updates.code ? updates.code.trim().toUpperCase() : clean;

    const index = list.findIndex((c) => c.code.toUpperCase() === clean);
    if (index === -1) {
      if (updates.code) {
        list.unshift(updates as CertificateRecord);
        this.setItem("certificates", list);
      } else {
        return false;
      }
    } else {
      list[index] = { ...list[index], ...updates, code: targetCode };
      if (updates.status === "ACTIVE") {
        delete (list[index] as any).replacedByCode;
        delete (list[index] as any).replacementReason;
      }
      this.setItem("certificates", list);
    }

    // Also sync updates to attendance_records so attendance sheets reflect edited details
    const attendanceRecords = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    let attChanged = false;
    Object.entries(attendanceRecords).forEach(([evId, recs]) => {
      if (Array.isArray(recs)) {
        recs.forEach((r) => {
          if (r.certificateCode && r.certificateCode.trim().toUpperCase() === clean) {
            r.certificateCode = targetCode;
            if (updates.recipientName) r.name = updates.recipientName;
            if (updates.recipientRollNumber !== undefined) r.rollNumber = updates.recipientRollNumber;
            if (updates.recipientEmail !== undefined) r.email = updates.recipientEmail;
            attChanged = true;
          }
        });
      }
    });
    if (attChanged) {
      this.setItem("attendance_records", attendanceRecords);
    }

    const client = getSupabase();
    if (client) {
      const payload: Record<string, any> = {};
      if (targetCode !== clean) payload.code = targetCode;
      if (updates.status) payload.status = updates.status;
      if (updates.recipientName) payload.recipient_name = updates.recipientName;
      if (updates.recipientRollNumber !== undefined) payload.recipient_roll_number = updates.recipientRollNumber;
      if (updates.recipientEmail !== undefined) payload.recipient_email = updates.recipientEmail;
      if (updates.eventTitle) payload.event_title = updates.eventTitle;
      if (updates.certificateType) payload.certificate_type = updates.certificateType;
      if (updates.recognitionLevel) payload.recognition_level = updates.recognitionLevel;
      if (updates.activityDate) payload.activity_date = updates.activityDate;
      if (updates.issueDate) payload.issue_date = updates.issueDate;
      if (updates.approverName) payload.approver_name = updates.approverName;
      if (updates.approverRole) payload.approver_role = updates.approverRole;
      if (updates.status === "ACTIVE") {
        payload.replaced_by_code = null;
        payload.replacement_reason = null;
      } else {
        if (updates.replacedByCode !== undefined) payload.replaced_by_code = updates.replacedByCode;
        if (updates.replacementReason !== undefined) payload.replacement_reason = updates.replacementReason;
      }
      if (updates.revocationDate !== undefined) payload.revocation_date = updates.revocationDate;
      if (updates.revocationReason !== undefined) payload.revocation_reason = updates.revocationReason;
      if (updates.sha256Fingerprint) payload.sha256_fingerprint = updates.sha256Fingerprint;

      if (Object.keys(payload).length > 0) {
        try {
          const { error } = await client
            .from("certificates")
            .update(payload)
            .eq("code", clean);
          if (error) console.warn("Supabase updateCertificate sync error:", error);
        } catch (err) {
          console.warn("Supabase updateCertificate error:", err);
        }
      }
    }

    return true;
  }

  async deleteCertificate(code: string): Promise<boolean> {
    const clean = code.trim().toUpperCase();
    const list = this.getCertificates();
    const filtered = list.filter((c) => c.code.toUpperCase() !== clean);
    this.setItem("certificates", filtered);

    // Also remove code from attendance records so it doesn't re-harvest
    const attendanceRecords = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    let changed = false;
    Object.entries(attendanceRecords).forEach(([evId, recs]) => {
      if (Array.isArray(recs)) {
        recs.forEach((r) => {
          if (r.certificateCode && r.certificateCode.trim().toUpperCase() === clean) {
            r.certificateCode = undefined;
            changed = true;
          }
        });
      }
    });
    if (changed) {
      this.setItem("attendance_records", attendanceRecords);
    }

    const client = getSupabase();
    if (client) {
      try {
        const { error } = await client.from("certificates").delete().eq("code", clean);
        if (error) console.warn("Supabase deleteCertificate sync error:", error);
      } catch (err) {
        console.warn("Supabase deleteCertificate error:", err);
      }
    }
    return true;
  }

  // --- Events ---
  getEvents(): EventItem[] {
    const list = this.getItem("events", SEED_EVENTS);
    return list.filter(
      (e) =>
        e &&
        e.title &&
        e.title.trim().length > 1 &&
        !["r", "q", "test"].includes(e.title.toLowerCase().trim()) &&
        !["2026/r", "2026/q"].includes(e.slug.toLowerCase().trim())
    );
  }

  async fetchEvents(): Promise<EventItem[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("events")
          .select("*")
          .order("start_date", { ascending: false });
        if (!error && data !== null) {
          const mapped: EventItem[] = data.map((d: any) => ({
            id: d.id || `evt-${Date.now()}`,
            slug: d.slug || "",
            title: d.title || "Untitled Event",
            description: d.description || "",
            learningObjectives: parseLearningObjectives(d.learning_objectives),
            targetAudience: d.target_audience || "",
            startDate: d.start_date || new Date().toISOString(),
            endDate: d.end_date || new Date().toISOString(),
            venue: d.venue || "UCET IUB",
            isOnline: Boolean(d.is_online),
            meetingLink: d.meeting_link || "",
            status: d.status || "UPCOMING",
            statusReason: d.status_reason || "",
            seatsLimit: Number(d.seats_limit) || 60,
            feePkr: Number(d.fee_pkr || 0),
            paymentInstructions: d.payment_instructions || "",
            certificateType: d.certificate_type || "Certificate of Participation",
            certificateRule: d.certificate_rule || "Minimum 80% physical attendance verified via digital check-in",
            vtoolsId: d.vtools_id || "",
            vtoolsLink: d.vtools_link || "",
            featuredImage: d.featured_image || "/ieee-cs-logo.png",
            galleryImages: Array.isArray(d.gallery_images) ? d.gallery_images.filter(Boolean) : [],
            eventReport: d.event_report || "",
            isRegistrationOpen: d.is_registration_open !== null && d.is_registration_open !== undefined ? Boolean(d.is_registration_open) : (d.status === "UPCOMING"),
          }));

          const cleanEvents = mapped.filter(
            (e) =>
              e &&
              e.title &&
              e.title.trim().length > 1 &&
              !["r", "q", "test"].includes(e.title.toLowerCase().trim()) &&
              !["2026/r", "2026/q"].includes(e.slug.toLowerCase().trim())
          );

          // Remote is the single source of truth
          this.setItem("events", cleanEvents);
          return cleanEvents;
        }
      } catch (err) {
        console.warn("Supabase fetchEvents error:", err);
      }
    }
    return this.getEvents();
  }

  getEventBySlug(slug: string): EventItem | undefined {
    const list = this.getEvents();
    const clean = slug.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    const baseClean = clean.split("/").pop() || clean;

    return list.find((e) => {
      const eClean = e.slug.trim().replace(/^\/+/, "").replace(/\/+$/, "");
      const eBase = eClean.split("/").pop() || eClean;
      return (
        eClean === clean ||
        eBase === baseClean ||
        eClean === `2026/${clean}` ||
        eClean === `2025/${clean}` ||
        clean === `2026/${eClean}` ||
        clean === `2025/${eClean}` ||
        eClean.endsWith(clean) ||
        clean.endsWith(eClean)
      );
    });
  }

  async fetchEventBySlug(slug: string): Promise<EventItem | undefined> {
    const clean = slug.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    const baseClean = clean.split("/").pop() || clean;

    // Check remote cloud database first
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("events")
          .select("*")
          .or(`slug.eq.${clean},slug.eq./${clean},slug.eq.2026/${baseClean},slug.eq.${baseClean}`)
          .limit(1)
          .maybeSingle();
        if (data && !error) {
          const evt: EventItem = {
            id: data.id || `evt-${Date.now()}`,
            slug: data.slug || "",
            title: data.title || "Untitled Event",
            description: data.description || "",
            learningObjectives: parseLearningObjectives(data.learning_objectives),
            targetAudience: data.target_audience || "",
            startDate: data.start_date || new Date().toISOString(),
            endDate: data.end_date || new Date().toISOString(),
            venue: data.venue || "UCET IUB",
            isOnline: Boolean(data.is_online),
            meetingLink: data.meeting_link || "",
            status: data.status || "UPCOMING",
            statusReason: data.status_reason || "",
            seatsLimit: Number(data.seats_limit) || 60,
            feePkr: Number(data.fee_pkr || 0),
            paymentInstructions: data.payment_instructions || "",
            certificateType: data.certificate_type || "Certificate of Participation",
            certificateRule: data.certificate_rule || "Minimum 80% physical attendance verified via digital check-in",
            vtoolsId: data.vtools_id || "",
            vtoolsLink: data.vtools_link || "",
            featuredImage: data.featured_image || "/ieee-cs-logo.png",
            galleryImages: Array.isArray(data.gallery_images) ? data.gallery_images.filter(Boolean) : [],
            eventReport: data.event_report || "",
            isRegistrationOpen: data.is_registration_open !== null && data.is_registration_open !== undefined ? Boolean(data.is_registration_open) : (data.status === "UPCOMING"),
          };
          return evt;
        }
      } catch (err) {
        console.warn("Supabase fetchEventBySlug fallback:", err);
      }
    }

    return this.getEventBySlug(clean);
  }

  getEventById(id: string): EventItem | undefined {
    return this.getEvents().find((e) => e.id === id);
  }

  async addEvent(event: EventItem): Promise<{ success: boolean; error?: string }> {
    const list = this.getEvents();
    // Prevent duplicate ID/slug
    const filtered = list.filter((e) => e.id !== event.id && e.slug !== event.slug);
    filtered.unshift(event);
    this.setItem("events", filtered);

    const client = getSupabase();
    if (client) {
      try {
        const payload: Record<string, any> = {
          slug: event.slug,
          title: event.title,
          description: event.description,
          learning_objectives: event.learningObjectives?.join("\n") || "",
          target_audience: event.targetAudience || "",
          start_date: event.startDate,
          end_date: event.endDate,
          venue: event.venue,
          is_online: Boolean(event.isOnline),
          meeting_link: event.meetingLink || null,
          status: event.status,
          status_reason: event.statusReason || null,
          is_registration_open: event.isRegistrationOpen !== undefined ? Boolean(event.isRegistrationOpen) : true,
          seats_limit: event.seatsLimit || 60,
          fee_pkr: event.feePkr || 0,
          payment_instructions: event.paymentInstructions || null,
          certificate_type: event.certificateType,
          certificate_rule: event.certificateRule || null,
          vtools_id: event.vtoolsId || null,
          vtools_link: event.vtoolsLink || null,
          featured_image: event.featuredImage || "/ieee-cs-logo.png",
          gallery_images: event.galleryImages || [],
          event_report: event.eventReport || null,
        };

        const { data: existing } = await client
          .from("events")
          .select("id")
          .eq("slug", event.slug)
          .maybeSingle();

        let opError: any = null;
        if (existing?.id) {
          const { error } = await client.from("events").update(payload).eq("id", existing.id);
          opError = error;
        } else {
          const { error } = await client.from("events").insert(payload);
          opError = error;
        }

        if (opError) {
          console.warn("Supabase full payload error, trying core payload:", opError);
          const corePayload = {
            slug: event.slug,
            title: event.title,
            description: event.description,
            start_date: event.startDate,
            end_date: event.endDate,
            venue: event.venue,
            status: event.status,
            fee_pkr: event.feePkr || 0,
            certificate_type: event.certificateType,
          };
          if (existing?.id) {
            const { error: coreErr } = await client.from("events").update(corePayload).eq("id", existing.id);
            if (coreErr) return { success: false, error: coreErr.message };
          } else {
            const { error: coreErr } = await client.from("events").insert(corePayload);
            if (coreErr) return { success: false, error: coreErr.message };
          }
        }
      } catch (err: any) {
        console.warn("Supabase addEvent sync error:", err);
        return { success: false, error: err?.message || String(err) };
      }
    }
    return { success: true };
  }

  async updateEvent(id: string, updates: Partial<EventItem>): Promise<boolean> {
    const list = this.getEvents();
    const index = list.findIndex((e) => e.id === id || e.slug === updates.slug);
    if (index === -1) return false;

    const targetSlug = list[index].slug;
    list[index] = { ...list[index], ...updates };
    this.setItem("events", list);

    const client = getSupabase();
    if (client) {
      try {
        const payload: Record<string, any> = {};
        if (updates.title) payload.title = updates.title;
        if (updates.slug) payload.slug = updates.slug;
        if (updates.description) payload.description = updates.description;
        if (updates.status) payload.status = updates.status;
        if (updates.statusReason !== undefined) payload.status_reason = updates.statusReason;
        if (updates.isRegistrationOpen !== undefined) payload.is_registration_open = Boolean(updates.isRegistrationOpen);
        if (updates.startDate) payload.start_date = updates.startDate;
        if (updates.endDate) payload.end_date = updates.endDate;
        if (updates.venue) payload.venue = updates.venue;
        if (updates.feePkr !== undefined) payload.fee_pkr = updates.feePkr;
        if (updates.paymentInstructions !== undefined) payload.payment_instructions = updates.paymentInstructions || null;
        if (updates.seatsLimit !== undefined) payload.seats_limit = updates.seatsLimit;
        if (updates.isOnline !== undefined) payload.is_online = updates.isOnline;
        if (updates.meetingLink !== undefined) payload.meeting_link = updates.meetingLink;
        if (updates.learningObjectives) payload.learning_objectives = updates.learningObjectives.join("\n");
        if (updates.certificateType) payload.certificate_type = updates.certificateType;
        if (updates.certificateRule !== undefined) payload.certificate_rule = updates.certificateRule;
        if (updates.featuredImage) payload.featured_image = updates.featuredImage;
        if (updates.galleryImages) payload.gallery_images = updates.galleryImages;
        if (updates.eventReport !== undefined) payload.event_report = updates.eventReport;

        if (Object.keys(payload).length > 0) {
          const { error } = await client
            .from("events")
            .update(payload)
            .eq("slug", targetSlug);
          if (error) {
            console.warn("Supabase updateEvent sync error, trying core:", error);
            const core: any = {};
            if (updates.title) core.title = updates.title;
            if (updates.description) core.description = updates.description;
            if (updates.venue) core.venue = updates.venue;
            if (updates.status) core.status = updates.status;
            if (updates.feePkr !== undefined) core.fee_pkr = updates.feePkr;
            if (Object.keys(core).length > 0) {
              await client.from("events").update(core).eq("slug", targetSlug);
            }
          }
        }
      } catch (err) {
        console.warn("Supabase updateEvent error:", err);
      }
    }

    return true;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const list = this.getEvents();
    const target = list.find((e) => e.id === id);
    if (!target) return false;

    const filtered = list.filter((e) => e.id !== id && e.slug !== target.slug);
    this.setItem("events", filtered);

    const client = getSupabase();
    if (client) {
      try {
        const { error } = await client
          .from("events")
          .delete()
          .or(`id.eq.${id},slug.eq.${target.slug}`);
        if (error) console.warn("Supabase deleteEvent sync error:", error);
      } catch (err) {
        console.warn("Supabase deleteEvent error:", err);
      }
    }

    return true;
  }

  // --- Certificate Templates ---
  getTemplates(): CertificateTemplate[] {
    return this.getItem("certificate_templates", SEED_TEMPLATES);
  }

  getActiveTemplate(): CertificateTemplate {
    const list = this.getTemplates();
    const active = list.find((t) => t.isDefault) || list[0] || SEED_TEMPLATES[0];
    return active;
  }

  setActiveTemplate(id: string): void {
    const list = this.getTemplates().map((t) => ({
      ...t,
      isDefault: t.id === id,
    }));
    this.setItem("certificate_templates", list);

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from("certificate_templates").update({ is_active: false, is_default: false }).neq("id", id);
          await client.from("certificate_templates").update({ is_active: true, is_default: true }).eq("id", id);
        } catch (err) {
          console.warn("Supabase setActiveTemplate error:", err);
        }
      })();
    }
  }

  getTemplateById(id: string): CertificateTemplate | undefined {
    return this.getTemplates().find((t) => t.id === id);
  }

  async fetchTemplateById(id: string): Promise<CertificateTemplate | undefined> {
    const local = this.getTemplateById(id);
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("certificate_templates")
          .select("*")
          .or(`id.eq.${id},name.eq.${id}`)
          .maybeSingle();
        if (data && !error) {
          const mapped: CertificateTemplate = {
            id: data.id,
            name: data.name,
            description: data.description || "",
            htmlContent: data.html_content || "",
            isDefault: Boolean(data.is_default || data.is_active),
            chairSignatureUrl: data.chair_signature_url || "",
            advisorSignatureUrl: data.advisor_signature_url || "",
            chairName: data.chair_name || "",
            chairTitle: data.chair_title || "",
            advisorName: data.advisor_name || "",
            advisorTitle: data.advisor_title || "",
            chapterLogoUrl: data.chapter_logo_url || "",
            universityLogoUrl: data.university_logo_url || "",
            ieeeLogoUrl: data.ieee_logo_url || "",
            eventLogoUrl: data.event_logo_url || "",
            createdAt: data.created_at,
          };
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase fetchTemplateById fallback:", err);
      }
    }
    return local;
  }

  async fetchActiveTemplate(): Promise<CertificateTemplate> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("certificate_templates")
          .select("*")
          .or("is_active.eq.true,is_default.eq.true")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data && !error) {
          const mapped: CertificateTemplate = {
            id: data.id,
            name: data.name,
            description: data.description || "",
            htmlContent: data.html_content || "",
            isDefault: true,
            chairSignatureUrl: data.chair_signature_url || "",
            advisorSignatureUrl: data.advisor_signature_url || "",
            chairName: data.chair_name || "",
            chairTitle: data.chair_title || "",
            advisorName: data.advisor_name || "",
            advisorTitle: data.advisor_title || "",
            chapterLogoUrl: data.chapter_logo_url || "",
            universityLogoUrl: data.university_logo_url || "",
            ieeeLogoUrl: data.ieee_logo_url || "",
            eventLogoUrl: data.event_logo_url || "",
            createdAt: data.created_at,
          };
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase fetchActiveTemplate fallback:", err);
      }
    }
    return this.getActiveTemplate();
  }

  async fetchTemplates(): Promise<CertificateTemplate[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("certificate_templates")
          .select("*")
          .order("created_at", { ascending: true });
        if (data && !error && data.length > 0) {
          const mapped: CertificateTemplate[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description || "",
            htmlContent: d.html_content || "",
            isDefault: d.is_default || d.is_active || false,
            chairSignatureUrl: d.chair_signature_url || "",
            advisorSignatureUrl: d.advisor_signature_url || "",
            chairName: d.chair_name || "",
            chairTitle: d.chair_title || "",
            advisorName: d.advisor_name || "",
            advisorTitle: d.advisor_title || "",
            chapterLogoUrl: d.chapter_logo_url || "",
            universityLogoUrl: d.university_logo_url || "",
            ieeeLogoUrl: d.ieee_logo_url || "",
            eventLogoUrl: d.event_logo_url || "",
            createdAt: d.created_at,
          }));
          this.setItem("certificate_templates", mapped);
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase fetchTemplates fallback:", err);
      }
    }
    return this.getTemplates();
  }

  async saveTemplate(tpl: CertificateTemplate): Promise<void> {
    const list = this.getTemplates();
    const shouldBeDefault = tpl.isDefault ?? true;

    // When saving as active default, clear default status from all others
    if (shouldBeDefault) {
      for (const item of list) {
        item.isDefault = false;
      }
    }

    const index = list.findIndex((t) => t.id === tpl.id || t.name === tpl.name);
    const updatedTpl: CertificateTemplate = {
      ...tpl,
      isDefault: shouldBeDefault,
    };

    if (index >= 0) {
      list[index] = { ...list[index], ...updatedTpl };
    } else {
      list.unshift(updatedTpl);
    }
    this.setItem("certificate_templates", list);

    const client = getSupabase();
    if (client) {
      const payload: Record<string, any> = {
        name: updatedTpl.name,
        description: updatedTpl.description || null,
        html_content: updatedTpl.htmlContent,
        chair_signature_url: updatedTpl.chairSignatureUrl || null,
        advisor_signature_url: updatedTpl.advisorSignatureUrl || null,
        chair_name: updatedTpl.chairName || null,
        chair_title: updatedTpl.chairTitle || null,
        advisor_name: updatedTpl.advisorName || null,
        advisor_title: updatedTpl.advisorTitle || null,
        chapter_logo_url: updatedTpl.chapterLogoUrl || null,
        university_logo_url: updatedTpl.universityLogoUrl || null,
        ieee_logo_url: updatedTpl.ieeeLogoUrl || null,
        event_logo_url: updatedTpl.eventLogoUrl || null,
        is_active: shouldBeDefault,
        is_default: shouldBeDefault,
      };

      try {
        if (shouldBeDefault) {
          await client.from("certificate_templates").update({ is_active: false, is_default: false }).neq("name", updatedTpl.name);
        }

        const { data: existing } = await client
          .from("certificate_templates")
          .select("id")
          .eq("name", updatedTpl.name)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await client.from("certificate_templates").update(payload).eq("id", existing.id);
          if (error) console.warn("Supabase saveTemplate sync error:", error);
        } else {
          const { error } = await client.from("certificate_templates").insert(payload);
          if (error) console.warn("Supabase saveTemplate sync error:", error);
        }
      } catch (err) {
        console.warn("Supabase saveTemplate error:", err);
      }
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const list = this.getTemplates();
    if (list.length <= 1) return false; // keep at least default
    const filtered = list.filter((t) => t.id !== id);
    this.setItem("certificate_templates", filtered);

    const client = getSupabase();
    if (client) {
      try {
        await client.from("certificate_templates").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase deleteTemplate error:", err);
      }
    }
    return true;
  }

  // --- Attendance Records ---
  getAttendance(eventId: string): AttendanceRecord[] {
    const stored = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    if (stored[eventId] !== undefined) {
      return stored[eventId];
    }
    return [];
  }

  saveAttendance(eventId: string, records: AttendanceRecord[]): void {
    const stored = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    stored[eventId] = records;
    this.setItem("attendance_records", stored);
  }

  async fetchAttendance(eventId: string, eventTitle?: string): Promise<AttendanceRecord[]> {
    const local = this.getAttendance(eventId);
    const certs = await this.fetchCertificates();
    const regs = await this.fetchRegistrations(eventId);

    const cleanId = (eventId || "").trim();
    const cleanTitle = (eventTitle || "").trim().toLowerCase();

    // 1. Filter certificates for this event
    const eventCerts = certs.filter((c) => {
      const matchId = cleanId && c.eventId && c.eventId === cleanId;
      const matchTitle = cleanTitle && c.eventTitle && c.eventTitle.trim().toLowerCase() === cleanTitle;
      const looseTitle = cleanTitle && c.eventTitle && (cleanTitle.includes("packet") && c.eventTitle.toLowerCase().includes("packet"));
      return matchId || matchTitle || looseTitle;
    });

    const map = new Map<string, AttendanceRecord>();

    // 2. Add local records first
    local.forEach((rec) => {
      const key = (rec.rollNumber?.trim().toLowerCase() || rec.email?.trim().toLowerCase() || rec.name.trim().toLowerCase());
      if (key) map.set(key, rec);
    });

    // 3. Merge registrations
    regs.forEach((reg) => {
      const key = (reg.rollNumber?.trim().toLowerCase() || reg.email?.trim().toLowerCase() || reg.fullName.trim().toLowerCase());
      if (key) {
        const existing = map.get(key);
        if (existing) {
          if (!existing.rollNumber && reg.rollNumber) existing.rollNumber = reg.rollNumber;
          if (!existing.email && reg.email) existing.email = reg.email;
          if (!existing.teamName && reg.teamName) existing.teamName = reg.teamName;
          if (!existing.projectTitle && reg.projectTitle) existing.projectTitle = reg.projectTitle;
          if ((!existing.teamMembers || existing.teamMembers.length === 0) && reg.teamMembers) existing.teamMembers = reg.teamMembers;
          if (!existing.projectDomain && reg.projectDomain) existing.projectDomain = reg.projectDomain;
        } else {
          map.set(key, {
            id: `att-reg-${reg.id}`,
            eventId,
            name: reg.fullName,
            rollNumber: reg.rollNumber || undefined,
            email: reg.email || undefined,
            attended: reg.status === "ATTENDED" || reg.status === "CONFIRMED",
            certificateCode: undefined,
            checkedInAt: reg.checkedInAt,
            teamName: reg.teamName,
            projectTitle: reg.projectTitle,
            teamMembers: reg.teamMembers,
            projectDomain: reg.projectDomain,
          });
        }
      }
    });

    // 4. Hydrate from already generated certificates in the cloud database
    eventCerts.forEach((cert) => {
      const normRoll = (cert.recipientRollNumber || "").trim().toLowerCase();
      const normEmail = (cert.recipientEmail || "").trim().toLowerCase();
      const normName = cert.recipientName.trim().toLowerCase();

      let matchKey: string | undefined;
      if (normRoll && map.has(normRoll)) matchKey = normRoll;
      else if (normEmail && map.has(normEmail)) matchKey = normEmail;
      else if (normName && map.has(normName)) matchKey = normName;

      if (matchKey) {
        const record = map.get(matchKey)!;
        record.attended = true;
        record.certificateCode = cert.code;
        if (!record.rollNumber && cert.recipientRollNumber) record.rollNumber = cert.recipientRollNumber;
        if (!record.email && cert.recipientEmail) record.email = cert.recipientEmail;
        if (!record.teamName && cert.teamName) record.teamName = cert.teamName;
        if (!record.projectTitle && cert.projectTitle) record.projectTitle = cert.projectTitle;
        if ((!record.teamMembers || record.teamMembers.length === 0) && cert.teamMembers) record.teamMembers = cert.teamMembers;
        if (!record.projectDomain && cert.projectDomain) record.projectDomain = cert.projectDomain;
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-cert-${cert.id || cert.code}`,
          eventId,
          name: cert.recipientName,
          rollNumber: cert.recipientRollNumber || undefined,
          email: cert.recipientEmail || undefined,
          attended: true,
          certificateCode: cert.code,
          checkedInAt: cert.createdAt || cert.issueDate || new Date().toISOString(),
          teamName: cert.teamName,
          projectTitle: cert.projectTitle,
          teamMembers: cert.teamMembers,
          projectDomain: cert.projectDomain,
        };
        const recordKey = normRoll || normEmail || normName;
        map.set(recordKey, newRecord);
      }
    });

    // 5. Special fallback for DigitalFest: If attendance is empty, seed from DIGITALFEST_TEAMS
    const isDigitalFest = cleanId === "3f6311ca-f0d0-4ac3-89fc-13d25a3f8e7f" || cleanId.includes("digitalfest") || cleanTitle.includes("digitalfest");
    if (isDigitalFest && map.size === 0 && DIGITALFEST_TEAMS.length > 0) {
      DIGITALFEST_TEAMS.forEach((team) => {
        const leaderKey = team.leader.trim().toLowerCase();
        map.set(leaderKey, {
          id: `att-df-${team.sr}`,
          eventId,
          name: team.leader,
          rollNumber: `SR-${team.sr}`,
          email: `${team.leader.toLowerCase().replace(/[^a-z0-9]/g, "")}.${team.sr}@ucet.iub.edu.pk`,
          attended: true,
          certificateCode: `CSIUB-26-DF${String(team.sr).padStart(2, "0")}`,
          teamName: team.teamName,
          projectTitle: team.projectTitle,
          teamMembers: team.members,
          projectDomain: `${team.semester} Semester`,
          checkedInAt: new Date().toISOString(),
        });
      });
    }

    const unifiedList = Array.from(map.values());
    if (unifiedList.length > 0) {
      this.saveAttendance(eventId, unifiedList);
    }
    return unifiedList;
  }

  clearAttendance(eventId: string): void {
    const stored = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    stored[eventId] = [];
    this.setItem("attendance_records", stored);
  }

  wipeAllAttendance(): void {
    this.setItem("attendance_records", {});
  }

  async clearEventCertificates(eventId: string, eventTitle?: string): Promise<number> {
    const list = this.getCertificates();
    const cleanId = (eventId || "").trim();
    const cleanTitle = (eventTitle || "").trim().toLowerCase();

    const remaining = list.filter((c) => {
      const matchId = cleanId && c.eventId && c.eventId === cleanId;
      const matchTitle = cleanTitle && c.eventTitle && c.eventTitle.trim().toLowerCase() === cleanTitle;
      return !matchId && !matchTitle;
    });

    const deletedCount = list.length - remaining.length;
    this.setItem("certificates", remaining);

    // Call server action to securely delete from Supabase
    try {
      await clearEventDataAction({ eventId: cleanId, eventTitle });
    } catch (err) {
      console.warn("clearEventDataAction notice:", err);
    }

    return deletedCount;
  }

  async clearEventCredentialsOnly(eventId: string, eventTitle?: string): Promise<number> {
    const list = this.getCertificates();
    const cleanId = (eventId || "").trim();
    const cleanTitle = (eventTitle || "").trim().toLowerCase();

    const remaining = list.filter((c) => {
      const matchId = cleanId && c.eventId && c.eventId === cleanId;
      const matchTitle = cleanTitle && c.eventTitle && c.eventTitle.trim().toLowerCase() === cleanTitle;
      return !matchId && !matchTitle;
    });

    const deletedCount = list.length - remaining.length;
    this.setItem("certificates", remaining);

    // Also remove certificate code references from the cached attendance records
    const stored = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    if (stored[cleanId]) {
      stored[cleanId] = stored[cleanId].map((rec) => ({
        ...rec,
        certificateCode: undefined,
      }));
      this.setItem("attendance_records", stored);
    }

    try {
      await wipeEventCredentialsOnlyAction({ eventId: cleanId, eventTitle });
    } catch (err) {
      console.warn("wipeEventCredentialsOnlyAction notice:", err);
    }

    this.addAuditLog(
      "Muhammad Roshan Ashraf",
      "DATA_WIPED",
      "certificates",
      eventId,
      `Cleared all verification codes and QR records for event ${eventTitle || eventId}.`
    );

    return deletedCount;
  }

  clearEventAttendanceOnly(eventId: string, eventTitle?: string): void {
    this.clearAttendance(eventId);
    const cleanId = (eventId || "").trim();
    const regs = this.getRegistrations().filter((r) => r.eventId !== cleanId);
    this.setItem("registrations", regs);

    this.addAuditLog(
      "Muhammad Roshan Ashraf",
      "DATA_WIPED",
      "attendance",
      eventId,
      `Cleared attendance sheet records for event ${eventTitle || eventId}.`
    );
  }

  async clearEventAttendanceAndCertificates(eventId: string, eventTitle?: string): Promise<void> {
    this.clearAttendance(eventId);
    // Clear local registrations for this event
    const cleanId = (eventId || "").trim();
    const cleanTitle = (eventTitle || "").trim().toLowerCase();
    const regs = this.getRegistrations().filter((r) => r.eventId !== cleanId);
    this.setItem("registrations", regs);

    await this.clearEventCertificates(eventId, eventTitle);
    this.addAuditLog(
      "Muhammad Roshan Ashraf",
      "DATA_WIPED",
      "events",
      eventId,
      `Cleared all attendance records and certificates for event ${eventTitle || eventId}.`
    );
  }

  async wipeAllCertificates(): Promise<number> {
    const list = this.getCertificates();
    const count = list.length;
    this.setItem("certificates", []);

    try {
      await wipeAllCertificatesAction();
    } catch (err) {
      console.warn("wipeAllCertificatesAction notice:", err);
    }
    return count;
  }

  toggleAttendance(eventId: string, recordId: string): AttendanceRecord[] {
    const records = this.getAttendance(eventId);
    const target = records.find((r) => r.id === recordId);
    if (target) {
      target.attended = !target.attended;
      if (target.attended && !target.checkedInAt) {
        target.checkedInAt = new Date().toISOString();
      }
      this.saveAttendance(eventId, records);
    }
    return records;
  }

  // --- Team (Officers & Faculty Advisors) ---
  getTeamMembers(): TeamMember[] {
    return this.getItem("team", SEED_TEAM);
  }

  async fetchTeamMembers(): Promise<TeamMember[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("team_members")
          .select("*")
          .order("order_index", { ascending: true });

        if (!error && data !== null) {
          const localList = this.getTeamMembers();
          const localMap = new Map<string, TeamMember>();
          localList.forEach((m) => {
            if (m.id) localMap.set(m.id, m);
            if (m.name && m.committeeYear) localMap.set(`${m.name}__${m.committeeYear}`, m);
          });

          const mapped: TeamMember[] = data.map((d: any) => {
            const local = localMap.get(d.id) || localMap.get(`${d.name}__${d.committee_year}`);
            return {
              id: d.id,
              name: d.name,
              position: d.position,
              committeeYear: d.committee_year,
              photoUrl: d.photo_url || local?.photoUrl || "",
              approvedBio: d.approved_bio || local?.approvedBio || "",
              isCurrent: d.is_current ?? local?.isCurrent ?? true,
              email: d.email || local?.email || "",
              linkedinUrl: d.linkedin_url || d.linkedinUrl || local?.linkedinUrl || "",
              orderIndex: d.order_index ?? local?.orderIndex ?? 0,
            };
          });

          this.setItem("team", mapped);
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase fetchTeamMembers error:", err);
      }
    }
    return this.getTeamMembers();
  }

  async saveTeamMember(member: TeamMember): Promise<void> {
    const list = this.getTeamMembers();
    const index = list.findIndex((m) => m.id === member.id || (m.name === member.name && m.committeeYear === member.committeeYear));
    if (index >= 0) {
      list[index] = { ...list[index], ...member };
    } else {
      list.push(member);
    }
    this.setItem("team", list);

    const client = getSupabase();
    if (client) {
      try {
        const payload: Record<string, any> = {
          name: member.name,
          position: member.position,
          committee_year: member.committeeYear,
          photo_url: member.photoUrl || "",
          approved_bio: member.approvedBio || "",
          is_current: member.isCurrent ?? true,
          email: member.email || null,
          linkedin_url: member.linkedinUrl || null,
          order_index: member.orderIndex ?? (index >= 0 ? index : list.length - 1),
        };

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(member.id);
        if (isUUID) {
          payload.id = member.id;
        }

        let existingId: string | undefined = undefined;
        if (isUUID) {
          const { data: byId } = await client
            .from("team_members")
            .select("id")
            .eq("id", member.id)
            .maybeSingle();
          if (byId?.id) existingId = byId.id;
        }
        if (!existingId) {
          const { data: byName } = await client
            .from("team_members")
            .select("id")
            .eq("name", member.name)
            .eq("committee_year", member.committeeYear)
            .maybeSingle();
          if (byName?.id) existingId = byName.id;
        }

        if (existingId) {
          const { error } = await client.from("team_members").update(payload).eq("id", existingId);
          if (error) console.warn("Supabase update team_member error:", error);
        } else {
          const { error } = await client.from("team_members").insert(payload);
          if (error) console.warn("Supabase insert team_member error:", error);
        }
      } catch (err) {
        console.warn("Supabase saveTeamMember sync error:", err);
      }
    }
  }

  async deleteTeamMember(id: string): Promise<void> {
    const list = this.getTeamMembers();
    const target = list.find((m) => m.id === id);
    const filtered = list.filter((m) => m.id !== id);
    this.setItem("team", filtered);

    const client = getSupabase();
    if (client) {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUUID) {
          await client.from("team_members").delete().eq("id", id);
        } else if (target) {
          await client.from("team_members").delete().eq("name", target.name).eq("committee_year", target.committeeYear);
        }
      } catch (err) {
        console.warn("Supabase deleteTeamMember error:", err);
      }
    }
  }

  // --- Event Teams & Projects (Competitions, Expos & Hackathons) ---
  getEventTeams(eventId: string): EventTeam[] {
    const stored = this.getItem<Record<string, EventTeam[]>>("event_teams", {});
    return stored[eventId] || [];
  }

  async fetchEventTeams(eventId: string): Promise<EventTeam[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("event_teams")
          .select("*")
          .eq("event_id", eventId)
          .order("sr", { ascending: true });

        if (!error && data !== null) {
          const mapped: EventTeam[] = data.map((d: any) => ({
            id: d.id,
            eventId: d.event_id,
            sr: d.sr ?? 0,
            teamName: d.team_name,
            projectTitle: d.project_title,
            teamLeader: d.team_leader,
            semester: d.semester || "",
            memberCount: d.member_count || (d.team_members?.length || 1),
            teamMembers: Array.isArray(d.team_members) ? d.team_members : [],
            projectDomain: d.project_domain || undefined,
            positionAward: d.position_award || undefined,
            demoUrl: d.demo_url || undefined,
            createdAt: d.created_at,
          }));
          const stored = this.getItem<Record<string, EventTeam[]>>("event_teams", {});
          stored[eventId] = mapped;
          this.setItem("event_teams", stored);
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase fetchEventTeams error:", err);
      }
    }
    return this.getEventTeams(eventId);
  }

  async saveEventTeam(team: EventTeam): Promise<void> {
    const stored = this.getItem<Record<string, EventTeam[]>>("event_teams", {});
    const list = stored[team.eventId] || [];
    const idx = list.findIndex((t) => t.id === team.id || (t.sr === team.sr && t.teamName === team.teamName));
    if (idx >= 0) {
      list[idx] = team;
    } else {
      list.push(team);
    }
    stored[team.eventId] = list;
    this.setItem("event_teams", stored);

    const client = getSupabase();
    if (client) {
      try {
        await client.from("event_teams").upsert({
          id: team.id,
          event_id: team.eventId,
          sr: team.sr,
          team_name: team.teamName,
          project_title: team.projectTitle,
          team_leader: team.teamLeader,
          semester: team.semester,
          member_count: team.memberCount,
          team_members: team.teamMembers,
          project_domain: team.projectDomain || null,
          position_award: team.positionAward || null,
          demo_url: team.demoUrl || null,
        });
      } catch (err) {
        console.warn("Supabase saveEventTeam error:", err);
      }
    }
  }

  async deleteEventTeam(eventId: string, teamId: string): Promise<void> {
    const stored = this.getItem<Record<string, EventTeam[]>>("event_teams", {});
    const list = (stored[eventId] || this.getEventTeams(eventId)).filter((t) => t.id !== teamId);
    stored[eventId] = list;
    this.setItem("event_teams", stored);

    const client = getSupabase();
    if (client) {
      try {
        await client.from("event_teams").delete().eq("id", teamId);
      } catch (err) {
        console.warn("Supabase deleteEventTeam error:", err);
      }
    }
  }

  async importTeamsFromText(eventId: string, rawText: string): Promise<{ teamsAdded: number; participantsAdded: number }> {
    const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const event = this.getEvents().find((e) => e.id === eventId);
    const existingTeams = this.getEventTeams(eventId);
    const newTeams: EventTeam[] = [];
    const newRegs: Registration[] = [];
    const newCerts: CertificateRecord[] = [];
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    let currentSr = existingTeams.length > 0 ? Math.max(...existingTeams.map((t) => t.sr)) + 1 : 1;

    for (const line of lines) {
      // Check if it's header line
      if (line.toLowerCase().includes("team name") || line.toLowerCase().includes("project title") || line.toLowerCase().includes("no. of members")) {
        continue;
      }

      // Support TSV (tab), CSV (comma), or Pipe (|)
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t").map((p) => p.trim());
      } else if (line.includes("|")) {
        parts = line.split("|").map((p) => p.trim());
      } else {
        parts = line.split(",").map((p) => p.trim());
      }

      if (parts.length < 3) continue;

      let sr = currentSr;
      let teamName = "";
      let memberCount = 1;
      let leader = "";
      let semester = "Current";
      let membersStr = "";
      let projectTitle = "";

      if (parts.length >= 7) {
        sr = parseInt(parts[0], 10) || currentSr;
        teamName = parts[1];
        memberCount = parseInt(parts[2], 10) || 1;
        leader = parts[3];
        semester = parts[4];
        membersStr = parts[5];
        projectTitle = parts[6];
      } else if (parts.length >= 5) {
        teamName = parts[0];
        leader = parts[1];
        semester = parts[2];
        membersStr = parts[3];
        projectTitle = parts[4];
      } else if (parts.length >= 3) {
        teamName = parts[0];
        projectTitle = parts[1];
        membersStr = parts[2];
        leader = membersStr.split(/[,&]/)[0]?.trim() || teamName;
      }

      if (!teamName || !projectTitle) continue;

      const memberNames = membersStr
        ? membersStr.split(/[,&]/).map((m) => m.trim()).filter(Boolean)
        : [leader || teamName];

      if (leader && !memberNames.includes(leader)) {
        memberNames.unshift(leader);
      }

      const teamId = `team-${eventId.replace("evt-", "")}-${sr}-${Date.now().toString().slice(-4)}`;
      const teamObj: EventTeam = {
        id: teamId,
        eventId,
        sr,
        teamName,
        projectTitle,
        teamLeader: leader || memberNames[0] || "Team Leader",
        semester,
        memberCount: memberNames.length,
        teamMembers: memberNames,
      };

      newTeams.push(teamObj);
      await this.saveEventTeam(teamObj);

      // Create Registrations and Certificates for each team member
      memberNames.forEach((studentName, sIdx) => {
        const rand = (sr * 997 + sIdx * 31 + Date.now()) % 100000;
        const code1 = chars[rand % chars.length] + chars[(rand + 5) % chars.length];
        const code2 = chars[(rand + 11) % chars.length] + chars[(rand + 17) % chars.length];
        const certCode = `CSIUB-26-T${String(sr).padStart(2, "0")}-${code1}${code2}`;
        const regId = `reg-${eventId.replace("evt-", "")}-${sr}-${sIdx + 1}`;

        const reg: Registration = {
          id: regId,
          eventId,
          privateToken: `token-${regId}`,
          fullName: studentName,
          namePreference: "FULL_NAME",
          email: `${studentName.toLowerCase().replace(/[^a-z]/g, "")}@iub.edu.pk`,
          phone: "+92-300-0000000",
          department: "Department of Information & Communication Engineering, IUB",
          rollNumber: `${semester} Semester • Team ${teamName}`,
          isIeeeMember: studentName === teamObj.teamLeader,
          photoConsent: true,
          status: "ATTENDED",
          ticketCode: `TCK-${certCode.slice(-4)}`,
          checkedInAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        const cert: CertificateRecord = {
          id: `cert-${regId}`,
          code: certCode,
          recipientName: studentName,
          publicNameFormat: "FULL_NAME",
          eventId,
          eventTitle: `${event?.title || "IEEE Chapter Event"} (Project: "${projectTitle}" · Team: ${teamName})`,
          certificateType: event?.certificateType || "Certificate of Participation & Project Merit",
          recognitionLevel: "CHAPTER_RECOGNITION",
          issuerStatement: "Official chapter recognition issued by IEEE Computer Society Student Branch Chapter UCET-IUB in collaboration with Cyber Security Student Club, Department of Information & Communication Engineering, IUB.",
          activityDate: event?.startDate.split("T")[0] || "2026-06-03",
          issueDate: new Date().toISOString().split("T")[0],
          approverName: "Muhammad Roshan Ashraf",
          approverRole: "Chapter Administrator & Event Lead",
          status: "ACTIVE",
          source: "IN_SITE_GENERATED",
          createdAt: new Date().toISOString(),
        };

        this.addRegistration(reg);
        newRegs.push(reg);
        newCerts.push(cert);
      });

      currentSr++;
    }

    if (newCerts.length > 0) {
      await this.addCertificatesBulk(newCerts);
    }

    if (event) {
      this.updateEvent(eventId, {
        registeredCount: (event.registeredCount || 0) + newRegs.length,
        seatsLimit: Math.max(event.seatsLimit || 0, (event.registeredCount || 0) + newRegs.length + 20),
      });
    }

    return { teamsAdded: newTeams.length, participantsAdded: newRegs.length };
  }

  // --- Upload Batches (Option 1) ---
  getBatches(): UploadBatch[] {
    return this.getItem("batches", SEED_BATCHES);
  }

  addBatch(batch: UploadBatch): void {
    const list = this.getBatches();
    list.unshift(batch);
    this.setItem("batches", list);
  }

  async approveBatch(batchId: string, approverName: string): Promise<{ success: boolean; cloudSaved: boolean; count: number; error?: string }> {
    const batches = this.getBatches();
    const batch = batches.find((b) => b.id === batchId);
    if (!batch || batch.status !== "STAGED") {
      return { success: false, cloudSaved: false, count: 0, error: "Batch not found or not in staged status." };
    }

    batch.status = "APPROVED";
    batch.approvedBy = approverName;
    batch.approvedAt = new Date().toISOString();
    this.setItem("batches", batches);

    // Convert staged rows to active certificates
    const newCerts: CertificateRecord[] = batch.stagedRows.map((row) => ({
      id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: row.code,
      recipientName: row.recipientName,
      recipientRollNumber: row.rollNumber || undefined,
      recipientEmail: row.email || undefined,
      publicNameFormat: "FULL_NAME",
      eventId: batch.eventId,
      eventTitle: batch.eventTitle,
      certificateType: row.certificateType,
      recognitionLevel: "CHAPTER_RECOGNITION",
      issuerStatement: CHAPTER_INFO.issuerStatementDefault,
      activityDate: new Date().toISOString().split("T")[0],
      issueDate: new Date().toISOString().split("T")[0],
      approverName: approverName,
      approverRole: "Administrator",
      status: "ACTIVE",
      source: "UPLOAD_REGISTRY",
      batchId: batch.id,
      createdAt: new Date().toISOString(),
    }));

    const bulkResult = await this.addCertificatesBulk(newCerts);

    // Log to Audit
    this.addAuditLog(
      approverName,
      "APPROVE_BATCH_PUBLISH",
      "upload_batches",
      batch.id,
      `Approved batch ${batch.filename}: published ${batch.rowCount} active certificates.`
    );

    return {
      success: true,
      cloudSaved: bulkResult.cloudSaved,
      count: newCerts.length,
      error: bulkResult.error,
    };
  }

  // --- Option 2: Registrations & Payments ---
  getRegistrations(): Registration[] {
    const raw = this.getItem<Registration[]>("registrations", []);
    let list = Array.isArray(raw) ? [...raw] : [];

    // Seed official DigitalFest 61 Expo teams if not yet present
    const hasDigitalFest = list.some(
      (r) =>
        r.eventId === "3f6311ca-f0d0-4ac3-89fc-13d25a3f8e7f" ||
        r.eventId === "evt-digitalfest-2026" ||
        (r.teamName && r.teamName.length > 0)
    );
    if (!hasDigitalFest && DIGITALFEST_REGISTRATIONS.length > 0) {
      list = [...list, ...DIGITALFEST_REGISTRATIONS];
      this.setItem("registrations", list);
    }

    // Deduplicate in memory by ticketCode and eventId+email
    const seen = new Set<string>();
    const deduplicated: Registration[] = [];
    for (const r of list) {
      if (!r) continue;
      const key = (r.ticketCode && r.ticketCode.trim())
        ? `ticket:${r.ticketCode.trim().toUpperCase()}`
        : `${r.eventId || ""}_${(r.email || "").trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(r);
      }
    }
    return deduplicated;
  }

  async fetchRegistrations(eventId?: string): Promise<Registration[]> {
    const localList = this.getRegistrations();
    // Use unique primary key: ticketCode, or id, or (eventId + email)
    const regMap = new Map<string, Registration>();
    const emailIndex = new Map<string, string>(); // eventId_email -> primaryKey

    const getKeys = (r: Partial<Registration>) => {
      const primaryKey = (r.ticketCode && r.ticketCode.trim())
        ? `TCK:${r.ticketCode.trim().toUpperCase()}`
        : (r.id ? `ID:${r.id}` : `AUTO:${Math.random()}`);
      const emailKey = (r.eventId && r.email)
        ? `${r.eventId}:${r.email.trim().toLowerCase()}`
        : null;
      return { primaryKey, emailKey };
    };

    const mergeRecord = (existing: Registration, incoming: Registration): Registration => {
      // Pick best roll number: avoid empty or "N/A"
      const bestRoll = (incoming.rollNumber && incoming.rollNumber.trim() && incoming.rollNumber !== "N/A" && incoming.rollNumber !== "N / A")
        ? incoming.rollNumber.trim().toUpperCase()
        : (existing.rollNumber ? existing.rollNumber.trim().toUpperCase() : existing.rollNumber);

      // Pick best phone: avoid empty or fallback dummy "0300-0000000"
      const bestPhone = (incoming.phone && incoming.phone.trim() && !incoming.phone.includes("0300-0000000") && incoming.phone !== "N/A")
        ? incoming.phone.trim()
        : existing.phone;

      return {
        ...existing,
        ...incoming,
        rollNumber: bestRoll || "N/A",
        phone: bestPhone || "0300-0000000",
        degreeProgram: incoming.degreeProgram || existing.degreeProgram,
        department: incoming.department || existing.department || "Computer Science",
        teamName: incoming.teamName || existing.teamName,
        projectTitle: incoming.projectTitle || existing.projectTitle,
        memberCount: incoming.memberCount || existing.memberCount,
        teamMembers: incoming.teamMembers && incoming.teamMembers.length > 0 ? incoming.teamMembers : existing.teamMembers,
        projectDomain: incoming.projectDomain || existing.projectDomain,
        projectSummary: incoming.projectSummary || existing.projectSummary,
        posterUrl: incoming.posterUrl || existing.posterUrl,
        videoDemoUrl: incoming.videoDemoUrl || existing.videoDemoUrl,
        teamLeaderPhone: incoming.teamLeaderPhone || existing.teamLeaderPhone,
        teamLeaderCnic: incoming.teamLeaderCnic || existing.teamLeaderCnic,
        semester: incoming.semester || existing.semester,
        city: incoming.city || existing.city,
        receiptId: incoming.receiptId || existing.receiptId,
        bankName: incoming.bankName || existing.bankName,
        prizeBankName: incoming.prizeBankName || existing.prizeBankName,
        prizeAccountNumber: incoming.prizeAccountNumber || existing.prizeAccountNumber,
      };
    };

    localList.forEach((r) => {
      const { primaryKey, emailKey } = getKeys(r);
      if (emailKey && emailIndex.has(emailKey)) {
        const existingKey = emailIndex.get(emailKey)!;
        const existing = regMap.get(existingKey);
        if (existing) {
          regMap.set(existingKey, mergeRecord(existing, r));
          return;
        }
      }

      regMap.set(primaryKey, r);
      if (emailKey) emailIndex.set(emailKey, primaryKey);
    });

    const client = getSupabase();
    if (client) {
      try {
        let query = client
          .from("registrations")
          .select("*")
          .order("created_at", { ascending: false });

        if (eventId) {
          query = query.eq("event_id", eventId);
        }

        const { data, error } = await query;
        if (data && !error && data.length > 0) {
          data.forEach((d: any) => {
            const mapped: Registration = {
              id: d.id,
              eventId: d.event_id || eventId || "",
              privateToken: d.private_token,
              fullName: d.full_name,
              namePreference: d.name_display_preference || "FULL_NAME",
              email: d.email,
              phone: d.phone,
              rollNumber: d.roll_number,
              degreeProgram: d.degree_program || d.program_degree || undefined,
              isIeeeMember: Boolean(d.is_ieee_member),
              ieeeMembershipNumber: d.ieee_membership_number,
              department: d.department,
              photoConsent: Boolean(d.photo_consent),
              status: d.status,
              ticketCode: d.ticket_code,
              createdAt: d.created_at,
            };

            const { primaryKey, emailKey } = getKeys(mapped);
            if (emailKey && emailIndex.has(emailKey)) {
              const existingKey = emailIndex.get(emailKey)!;
              const existing = regMap.get(existingKey);
              if (existing) {
                regMap.set(existingKey, mergeRecord(existing, mapped));
                return;
              }
            }

            if (regMap.has(primaryKey)) {
              const existing = regMap.get(primaryKey)!;
              regMap.set(primaryKey, mergeRecord(existing, mapped));
            } else {
              regMap.set(primaryKey, mapped);
              if (emailKey) emailIndex.set(emailKey, primaryKey);
            }
          });
        }
      } catch (err) {
        console.warn("Supabase fetchRegistrations fallback:", err);
      }
    }

    const merged = Array.from(regMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    this.setItem("registrations", merged);

    if (eventId) {
      return merged.filter((r) => r.eventId === eventId);
    }
    return merged;
  }

  saveRegistrations(regs: Registration[]): void {
    this.setItem("registrations", regs);
  }

  deduplicateRegistrations(): { before: number; after: number; removed: number } {
    const list = this.getRegistrations();
    const before = list.length;
    const seen = new Map<string, Registration>();

    for (const r of list) {
      const emailKey = `${r.eventId || ""}_${(r.email || "").trim().toLowerCase()}`;
      if (!seen.has(emailKey)) {
        seen.set(emailKey, r);
      } else {
        const existing = seen.get(emailKey)!;
        const bestRoll = (r.rollNumber && r.rollNumber !== "N/A" && r.rollNumber !== "N / A") ? r.rollNumber.trim().toUpperCase() : existing.rollNumber;
        const bestPhone = (r.phone && r.phone !== "0300-0000000" && r.phone !== "N/A") ? r.phone : existing.phone;
        seen.set(emailKey, {
          ...existing,
          ...r,
          rollNumber: bestRoll,
          phone: bestPhone,
        });
      }
    }

    const cleaned = Array.from(seen.values());
    this.setItem("registrations", cleaned);
    return { before, after: cleaned.length, removed: before - cleaned.length };
  }

  async addRegistration(reg: Registration): Promise<void> {
    const cleanRoll = reg.rollNumber && reg.rollNumber !== "N/A" ? reg.rollNumber.trim().toUpperCase() : reg.rollNumber;
    const sanitizedReg = { ...reg, rollNumber: cleanRoll };

    const list = this.getRegistrations();
    const existingIdx = list.findIndex(
      (r) =>
        r.id === sanitizedReg.id ||
        (sanitizedReg.ticketCode && r.ticketCode === sanitizedReg.ticketCode) ||
        (r.eventId === sanitizedReg.eventId && r.email.toLowerCase() === sanitizedReg.email.toLowerCase())
    );
    if (existingIdx >= 0) {
      list[existingIdx] = {
        ...list[existingIdx],
        ...sanitizedReg,
        rollNumber: (sanitizedReg.rollNumber && sanitizedReg.rollNumber !== "N/A") ? sanitizedReg.rollNumber : list[existingIdx].rollNumber,
        phone: (sanitizedReg.phone && sanitizedReg.phone !== "0300-0000000") ? sanitizedReg.phone : list[existingIdx].phone,
      };
    } else {
      list.unshift(sanitizedReg);
    }
    this.setItem("registrations", list);

    const client = getSupabase();
    if (client) {
      try {
        const { error } = await client.from("registrations").upsert({
          id: sanitizedReg.id,
          event_id: sanitizedReg.eventId,
          full_name: sanitizedReg.fullName,
          name_display_preference: sanitizedReg.namePreference || "FULL_NAME",
          email: sanitizedReg.email,
          phone: sanitizedReg.phone,
          roll_number: cleanRoll || null,
          department: reg.department,
          degree_program: reg.degreeProgram || null,
          is_ieee_member: reg.isIeeeMember,
          ieee_membership_number: reg.ieeeMembershipNumber,
          photo_consent: reg.photoConsent,
          status: reg.status,
          ticket_code: reg.ticketCode,
          private_token: reg.privateToken,
        }, { onConflict: "id" });
        if (error) console.warn("Supabase addRegistration sync error:", error);
      } catch (err) {
        console.warn("Supabase addRegistration error:", err);
      }
    }
  }

  async updateRegistration(id: string, updates: Partial<Registration>): Promise<boolean> {
    const list = this.getRegistrations();
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return false;

    list[index] = { ...list[index], ...updates };
    this.setItem("registrations", list);

    const client = getSupabase();
    if (client) {
      try {
        const payload: Record<string, any> = {};
        if (updates.fullName) payload.full_name = updates.fullName;
        if (updates.email) payload.email = updates.email;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.rollNumber !== undefined) payload.roll_number = updates.rollNumber;
        if (updates.department) payload.department = updates.department;
        if (updates.degreeProgram !== undefined) payload.degree_program = updates.degreeProgram;
        if (updates.isIeeeMember !== undefined) payload.is_ieee_member = updates.isIeeeMember;
        if (updates.ieeeMembershipNumber !== undefined) payload.ieee_membership_number = updates.ieeeMembershipNumber;
        if (updates.status) payload.status = updates.status;

        if (Object.keys(payload).length > 0) {
          const { error } = await client.from("registrations").update(payload).eq("id", id);
          if (error) console.warn("Supabase updateRegistration error:", error);
        }
      } catch (err) {
        console.warn("Supabase updateRegistration exception:", err);
      }
    }

    return true;
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const list = this.getRegistrations();
    const filtered = list.filter((r) => r.id !== id);
    this.setItem("registrations", filtered);

    const client = getSupabase();
    if (client) {
      try {
        const { error } = await client.from("registrations").delete().eq("id", id);
        if (error) console.warn("Supabase deleteRegistration error:", error);
      } catch (err) {
        console.warn("Supabase deleteRegistration exception:", err);
      }
    }

    return true;
  }

  getPayments(): PaymentProof[] {
    return this.getItem("payments", SEED_PAYMENTS);
  }

  async fetchPayments(): Promise<PaymentProof[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });
        if (data && !error) {
          const list: PaymentProof[] = data.map((d: any) => ({
            id: d.id,
            registrationId: d.registration_id,
            recipientName: d.recipient_name || "Participant",
            eventTitle: d.event_title || "Event",
            amountPkr: Number(d.amount_pkr || 0),
            paymentMethod: d.payment_method,
            transactionId: d.transaction_id,
            proofImageUrl: d.proof_image_url,
            status: d.status,
            rejectionReason: d.rejection_reason,
            createdAt: d.created_at,
          }));
          this.setItem("payments", list);
          return list;
        }
      } catch (err) {
        console.warn("Supabase fetchPayments fallback:", err);
      }
    }
    return this.getPayments();
  }

  addPayment(payment: PaymentProof): void {
    const list = this.getPayments();
    list.unshift(payment);
    this.setItem("payments", list);
  }

  verifyPayment(paymentId: string, verifiedBy: string, status: "VERIFIED" | "REJECTED", reason?: string): boolean {
    const payments = this.getPayments();
    const pay = payments.find((p) => p.id === paymentId);
    if (!pay) return false;

    pay.status = status;
    pay.verifiedBy = verifiedBy;
    pay.verifiedAt = new Date().toISOString();
    if (reason) pay.rejectionReason = reason;
    this.setItem("payments", payments);

    // If verified, update registration status to CONFIRMED
    if (status === "VERIFIED") {
      const regs = this.getRegistrations();
      const reg = regs.find((r) => r.id === pay.registrationId);
      if (reg) {
        reg.status = "CONFIRMED";
        this.setItem("registrations", regs);
      }
    }

    const client = getSupabase();
    if (client) {
      client.from("payments").update({
        status,
        verified_by: verifiedBy,
        verified_at: pay.verifiedAt,
        rejection_reason: reason || null,
      }).eq("id", paymentId).then(({ error }) => {
        if (error) console.warn("Supabase verifyPayment sync error:", error);
      });

      if (status === "VERIFIED") {
        client.from("registrations").update({
          status: "CONFIRMED"
        }).eq("id", pay.registrationId).then(({ error }) => {
          if (error) console.warn("Supabase registration confirm error:", error);
        });
      }
    }

    this.addAuditLog(
      verifiedBy,
      `PAYMENT_${status}`,
      "payments",
      pay.id,
      `Payment TX ${pay.transactionId} (${pay.amountPkr} PKR) for ${pay.recipientName} marked as ${status}.`
    );

    return true;
  }

  recordCheckin(ticketCode: string, staffName: string): { success: boolean; message: string; reg?: Registration } {
    const regs = this.getRegistrations();
    const reg = regs.find((r) => r.ticketCode?.toUpperCase() === ticketCode.trim().toUpperCase());
    if (!reg) {
      return { success: false, message: "Ticket code not found." };
    }
    if (reg.status === "ATTENDED") {
      return {
        success: false,
        message: `Warning: Already checked in on ${reg.checkedInAt}!`,
        reg,
      };
    }
    reg.status = "ATTENDED";
    reg.checkedInAt = new Date().toISOString();
    this.setItem("registrations", regs);

    const client = getSupabase();
    if (client) {
      client.from("registrations").update({
        status: "ATTENDED",
        checked_in_at: reg.checkedInAt,
      }).eq("id", reg.id).then(({ error }) => {
        if (error) console.warn("Supabase recordCheckin sync error:", error);
      });
    }

    this.addAuditLog(
      staffName,
      "TICKET_CHECKIN",
      "registrations",
      reg.id,
      `Attendee ${reg.fullName} (Ticket ${ticketCode}) successfully checked in.`
    );

    return { success: true, message: "Check-in recorded successfully!", reg };
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLogItem[] {
    return this.getItem("audit_logs", SEED_AUDIT);
  }

  async fetchAuditLogs(): Promise<AuditLogItem[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false });
        if (data && !error) {
          const list: AuditLogItem[] = data.map((d: any) => ({
            id: d.id,
            staffUser: d.staff_email,
            action: d.action,
            entityType: d.entity_type,
            entityId: d.entity_id || "",
            details: typeof d.after_state === "string" ? d.after_state : JSON.stringify(d.after_state || {}),
            timestamp: d.created_at,
          }));
          this.setItem("audit_logs", list);
          return list;
        }
      } catch (err) {
        console.warn("Supabase fetchAuditLogs fallback:", err);
      }
    }
    return this.getAuditLogs();
  }

  addAuditLog(staffUser: string, action: string, entityType: string, entityId: string, details: string): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `aud-${Date.now()}`,
      staffUser,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
    this.setItem("audit_logs", logs);

    const client = getSupabase();
    if (client) {
      client.from("audit_logs").insert({
        staff_email: staffUser,
        action,
        entity_type: entityType,
        entity_id: entityId,
        after_state: { details },
      }).then(({ error }) => {
        if (error) console.warn("Supabase addAuditLog sync error:", error);
      });
    }
  }

  // Upload & seed all official chapter production records to cloud database
  async seedCloudDatabase(): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> {
    const client = getSupabase();
    if (!client) {
      return { success: false, message: "Cloud database not configured. Please enter Supabase credentials first." };
    }

    const counts: Record<string, number> = { events: 0, team: 0, templates: 0, eventTeams: 0, certificates: 0 };

    try {
      // 1. Seed Events
      for (const evt of SEED_EVENTS) {
        const payload = {
          slug: evt.slug,
          title: evt.title,
          description: evt.description,
          learning_objectives: evt.learningObjectives?.join("\n") || "",
          target_audience: evt.targetAudience || "",
          start_date: evt.startDate,
          end_date: evt.endDate,
          venue: evt.venue,
          is_online: Boolean(evt.isOnline),
          status: evt.status,
          seats_limit: evt.seatsLimit,
          fee_pkr: evt.feePkr,
          certificate_type: evt.certificateType,
          certificate_rule: evt.certificateRule,
          vtools_id: evt.vtoolsId,
          vtools_link: evt.vtoolsLink,
          featured_image: evt.featuredImage,
          gallery_images: evt.galleryImages || [],
          event_report: evt.eventReport,
        };
        const { error } = await client.from("events").upsert(payload, { onConflict: "slug" });
        if (!error) counts.events++;
        else console.warn("Seed event notice:", error.message);
      }

      // 2. Seed Team
      for (let i = 0; i < SEED_TEAM.length; i++) {
        const m = SEED_TEAM[i];
        const payload = {
          name: m.name,
          position: m.position,
          committee_year: m.committeeYear,
          photo_url: m.photoUrl || "",
          approved_bio: m.approvedBio || "",
          is_current: m.isCurrent ?? true,
          order_index: i,
        };
        const { error } = await client.from("team_members").insert(payload);
        if (!error) counts.team++;
      }

      // 3. Seed Templates
      for (const tpl of SEED_TEMPLATES) {
        const payload = {
          name: tpl.name,
          description: tpl.description || "",
          html_content: tpl.htmlContent,
          is_active: tpl.isDefault ?? false,
          is_default: tpl.isDefault ?? false,
        };
        const { error } = await client.from("certificate_templates").insert(payload);
        if (!error) counts.templates++;
      }

      // 4. Clean up any legacy event teams
      try {
        await client.from("event_teams").delete().neq("id", "none");
      } catch {}

      // 5. Seed Certificates in batches of 25
      for (let i = 0; i < SEED_CERTIFICATES.length; i += 25) {
        const chunk = SEED_CERTIFICATES.slice(i, i + 25).map((c) => ({
          code: c.code,
          recipient_name: c.recipientName,
          public_name_format: c.publicNameFormat,
          event_title: c.eventTitle,
          certificate_type: c.certificateType,
          recognition_level: c.recognitionLevel,
          issuer_statement: c.issuerStatement,
          activity_date: c.activityDate,
          issue_date: c.issueDate,
          approver_name: c.approverName,
          approver_role: c.approverRole,
          status: c.status,
          source: c.source,
        }));
        const { error } = await client.from("certificates").upsert(chunk, { onConflict: "code" });
        if (!error) counts.certificates += chunk.length;
      }

      return {
        success: true,
        message: `Successfully seeded ${counts.events} events, ${counts.team} officers, ${counts.templates} templates, and ${counts.certificates} certificates into cloud database.`,
        counts,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to seed database.", counts };
    }
  }

  getChapterSettings(): ChapterSettings {
    const saved = this.getItem<ChapterSettings | null>("chapter_settings", null);
    if (saved && saved.emailGeneral) {
      return { ...DEFAULT_CHAPTER_SETTINGS, ...saved };
    }
    return DEFAULT_CHAPTER_SETTINGS;
  }

  async fetchChapterSettings(): Promise<ChapterSettings> {
    const local = this.getChapterSettings();
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("chapter_settings")
          .select("*")
          .eq("id", "current")
          .maybeSingle();

        if (!error && data) {
          const settings: ChapterSettings = {
            id: data.id,
            emailGeneral: data.email_general || DEFAULT_CHAPTER_SETTINGS.emailGeneral,
            emailVerify: data.email_verify || DEFAULT_CHAPTER_SETTINGS.emailVerify,
            whatsappGroupUrl: data.whatsapp_group_url || DEFAULT_CHAPTER_SETTINGS.whatsappGroupUrl,
            whatsappChatNumber: data.whatsapp_chat_number || DEFAULT_CHAPTER_SETTINGS.whatsappChatNumber,
            linkedinUrl: data.linkedin_url || DEFAULT_CHAPTER_SETTINGS.linkedinUrl,
            instagramUrl: data.instagram_url || DEFAULT_CHAPTER_SETTINGS.instagramUrl,
            facebookUrl: data.facebook_url || DEFAULT_CHAPTER_SETTINGS.facebookUrl,
            githubUrl: data.github_url || DEFAULT_CHAPTER_SETTINGS.githubUrl,
            parentBranchUrl: data.parent_branch_url || DEFAULT_CHAPTER_SETTINGS.parentBranchUrl,
            sectionUrl: data.section_url || DEFAULT_CHAPTER_SETTINGS.sectionUrl,
            addressRoom1: data.address_room_1 || DEFAULT_CHAPTER_SETTINGS.addressRoom1,
            addressRoom2: data.address_room_2 || DEFAULT_CHAPTER_SETTINGS.addressRoom2,
            updatedAt: data.updated_at,
            updatedBy: data.updated_by,
          };
          this.setItem("chapter_settings", settings);
          return settings;
        }
      } catch (err) {
        console.warn("fetchChapterSettings warning:", err);
      }
    }
    return local;
  }

  async saveChapterSettings(
    settings: ChapterSettings,
    staffName?: string
  ): Promise<{ success: boolean; error?: string }> {
    const clean: ChapterSettings = {
      ...DEFAULT_CHAPTER_SETTINGS,
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: staffName || "Chapter Administrator",
    };
    this.setItem("chapter_settings", clean);

    const client = getSupabase();
    if (client) {
      try {
        const payload = {
          id: "current",
          email_general: clean.emailGeneral.trim(),
          email_verify: clean.emailVerify.trim(),
          whatsapp_group_url: clean.whatsappGroupUrl.trim(),
          whatsapp_chat_number: clean.whatsappChatNumber.trim(),
          linkedin_url: clean.linkedinUrl.trim(),
          instagram_url: clean.instagramUrl.trim(),
          facebook_url: clean.facebookUrl.trim(),
          github_url: clean.githubUrl.trim(),
          parent_branch_url: clean.parentBranchUrl.trim(),
          section_url: clean.sectionUrl.trim(),
          address_room_1: clean.addressRoom1.trim(),
          address_room_2: clean.addressRoom2.trim(),
          updated_at: clean.updatedAt,
          updated_by: clean.updatedBy,
        };

        const { error } = await client
          .from("chapter_settings")
          .upsert(payload, { onConflict: "id" });

        if (error) {
          console.warn("Supabase saveChapterSettings error:", error.message);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.warn("Supabase saveChapterSettings exception:", err);
        return { success: false, error: err?.message };
      }
    }

    this.addAuditLog(
      staffName || "Chapter Administrator",
      "CHAPTER_SETTINGS_UPDATED",
      "settings",
      "current",
      "Updated Chapter Contact, WhatsApp, Social links, and Campus addresses."
    );

    return { success: true };
  }

  // Reset database and wipe all local storage keys
  resetAll(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem("ieee_cs_certificates");
    localStorage.removeItem("ieee_cs_events");
    localStorage.removeItem("ieee_cs_team");
    localStorage.removeItem("ieee_cs_batches");
    localStorage.removeItem("ieee_cs_registrations");
    localStorage.removeItem("ieee_cs_payments");
    localStorage.removeItem("ieee_cs_audit_logs");
    localStorage.removeItem("event_teams");
    localStorage.removeItem("certificates");
    localStorage.removeItem("events");
    localStorage.removeItem("team");
    localStorage.removeItem("registrations");
    localStorage.removeItem("payments");
  }
}

export const db = new ChapterDatabase();
