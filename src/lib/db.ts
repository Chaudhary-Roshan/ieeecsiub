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
  EventTeam
} from "@/types";
import { INITIAL_STAFF_USERS, CHAPTER_INFO } from "./constants";
import { getSupabase } from "./supabase";
import { DEFAULT_CERTIFICATE_HTML } from "./defaultCertificateHtml";
import {
  TEMPLATE_DESIGN1_SIMPLE,
  TEMPLATE_DESIGN2_BLUE_PANEL,
  TEMPLATE_DESIGN3_CENTERED,
  TEMPLATE_SERIES1_VOLUNTEER,
  TEMPLATE_EXPO_WINNER_MEMBERS,
  TEMPLATE_EXPO_PARTICIPATION_MEMBERS,
} from "./certificateTemplates";
import { DIGITALFEST_PARTICIPANTS } from "./digitalFestData";

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

  // --- Certificates ---
  getCertificates(): CertificateRecord[] {
    return this.getItem("certificates", SEED_CERTIFICATES);
  }

  getCertificateByCode(code: string): CertificateRecord | undefined {
    const list = this.getCertificates();
    const clean = code.trim().toUpperCase();
    return list.find((c) => c.code.toUpperCase() === clean);
  }

  async fetchCertificateByCode(code: string): Promise<CertificateRecord | undefined> {
    const clean = code.trim().toUpperCase();
    const client = getSupabase();

    if (client) {
      try {
        // First try the secure verification RPC which works under anon RLS
        const { data: rpcData, error: rpcError } = await client.rpc("verify_certificate", {
          cert_code: clean,
        });

        if (rpcData && !rpcError && rpcData.found) {
          const mapped: CertificateRecord = {
            id: rpcData.code,
            code: rpcData.code,
            recipientName: rpcData.recipient_name,
            publicNameFormat: "FULL_NAME",
            eventId: "",
            eventTitle: rpcData.event_name || "IEEE Technical Session",
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
          return mapped;
        }

        // Fallback to direct select for authenticated staff or fallback schemas
        const { data, error } = await client
          .from("certificates")
          .select("*")
          .eq("code", clean)
          .maybeSingle();

        if (data && !error) {
          const mapped: CertificateRecord = {
            id: data.id,
            code: data.code,
            recipientName: data.recipient_name,
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
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase fetchCertificateByCode error:", err);
      }
    }

    return this.getCertificateByCode(clean);
  }

  async fetchCertificates(): Promise<CertificateRecord[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from("certificates")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data !== null) {
          const list: CertificateRecord[] = data.map((d: any) => ({
            id: d.id,
            code: d.code,
            recipientName: d.recipient_name,
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

          this.setItem("certificates", list);
          return list;
        }
      } catch (err) {
        console.warn("Supabase fetchCertificates error:", err);
      }
    }
    return this.getCertificates();
  }

  async addCertificate(cert: CertificateRecord): Promise<boolean> {
    const list = this.getCertificates();
    const cleanCode = cert.code.trim().toUpperCase();
    const filtered = list.filter((c) => c.code.toUpperCase() !== cleanCode);
    filtered.unshift(cert);
    this.setItem("certificates", filtered);

    const client = getSupabase();
    if (client) {
      const payload: Record<string, any> = {
        code: cleanCode,
        recipient_name: cert.recipientName,
        public_name_format: cert.publicNameFormat,
        event_id: cert.eventId || null,
        event_title: cert.eventTitle,
        certificate_type: cert.certificateType,
        recognition_level: cert.recognitionLevel,
        issuer_statement: cert.issuerStatement,
        activity_date: cert.activityDate,
        issue_date: cert.issueDate,
        approver_name: cert.approverName,
        approver_role: cert.approverRole,
        status: cert.status,
        source: cert.source,
        template_id: cert.templateId || null,
        team_name: cert.teamName || null,
        project_title: cert.projectTitle || null,
        replaced_by_code: cert.replacedByCode,
        replacement_reason: cert.replacementReason,
        revocation_date: cert.revocationDate,
        revocation_reason: cert.revocationReason,
        sha256_fingerprint: cert.sha256Fingerprint,
        pdf_url: cert.pdfUrl,
      };

      try {
        const { data: existing } = await client
          .from("certificates")
          .select("id")
          .eq("code", cleanCode)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await client.from("certificates").update(payload).eq("id", existing.id);
          if (error) console.warn("Supabase addCertificate sync error:", error);
        } else {
          const { error } = await client.from("certificates").insert(payload);
          if (error) console.warn("Supabase addCertificate sync error:", error);
        }
      } catch (err) {
        console.warn("Supabase addCertificate error:", err);
      }
    }
    return true;
  }

  async updateCertificate(code: string, updates: Partial<CertificateRecord>): Promise<boolean> {
    const list = this.getCertificates();
    const clean = code.trim().toUpperCase();
    const index = list.findIndex((c) => c.code.toUpperCase() === clean);
    if (index === -1) {
      if (updates.code) {
        list.unshift(updates as CertificateRecord);
        this.setItem("certificates", list);
      } else {
        return false;
      }
    } else {
      list[index] = { ...list[index], ...updates };
      this.setItem("certificates", list);
    }

    const client = getSupabase();
    if (client) {
      const payload: Record<string, any> = {};
      if (updates.status) payload.status = updates.status;
      if (updates.recipientName) payload.recipient_name = updates.recipientName;
      if (updates.replacedByCode) payload.replaced_by_code = updates.replacedByCode;
      if (updates.replacementReason) payload.replacement_reason = updates.replacementReason;
      if (updates.revocationDate) payload.revocation_date = updates.revocationDate;
      if (updates.revocationReason) payload.revocation_reason = updates.revocationReason;
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
    return this.getItem("events", SEED_EVENTS);
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
            learningObjectives: typeof d.learning_objectives === "string" ? d.learning_objectives.split("\n").filter(Boolean) : (Array.isArray(d.learning_objectives) ? d.learning_objectives : []),
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
          }));

          // Remote is the single source of truth
          this.setItem("events", mapped);
          return mapped;
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
          .or(`slug.eq.${clean},slug.eq.2026/${baseClean},slug.eq.${baseClean}`)
          .maybeSingle();
        if (data && !error) {
          const evt: EventItem = {
            id: data.id || `evt-${Date.now()}`,
            slug: data.slug || "",
            title: data.title || "Untitled Event",
            description: data.description || "",
            learningObjectives: typeof data.learning_objectives === "string" ? data.learning_objectives.split("\n").filter(Boolean) : (Array.isArray(data.learning_objectives) ? data.learning_objectives : []),
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
        if (updates.startDate) payload.start_date = updates.startDate;
        if (updates.endDate) payload.end_date = updates.endDate;
        if (updates.venue) payload.venue = updates.venue;
        if (updates.feePkr !== undefined) payload.fee_pkr = updates.feePkr;
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
    if (stored[eventId] && stored[eventId].length > 0) {
      return stored[eventId];
    }
    // Auto-generate initial attendance list from registrations if empty
    const regs = this.getRegistrations().filter((r) => r.eventId === eventId);
    const certs = this.getCertificates().filter((c) => c.eventId === eventId);
    return regs.map((r) => {
      const matchCert = certs.find((c) => c.recipientName.trim().toLowerCase() === r.fullName.trim().toLowerCase());
      return {
        id: r.id,
        eventId: r.eventId,
        name: r.fullName,
        rollNumber: r.rollNumber,
        email: r.email,
        attended: r.status === "ATTENDED",
        certificateCode: matchCert?.code || (r.ticketCode ? `CSIUB-26-${r.ticketCode.slice(-4)}` : undefined),
        checkedInAt: r.checkedInAt,
      };
    });
  }

  saveAttendance(eventId: string, records: AttendanceRecord[]): void {
    const stored = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    stored[eventId] = records;
    this.setItem("attendance_records", stored);
  }

  clearAttendance(eventId: string): void {
    const stored = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    delete stored[eventId];
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

    const client = getSupabase();
    if (client) {
      try {
        if (cleanId) {
          await client.from("certificates").delete().eq("event_id", cleanId);
        }
        if (cleanTitle) {
          await client.from("certificates").delete().ilike("event_title", cleanTitle);
        }
      } catch (err) {
        console.warn("Supabase clearEventCertificates error:", err);
      }
    }

    return deletedCount;
  }

  async clearEventAttendanceAndCertificates(eventId: string, eventTitle?: string): Promise<void> {
    this.clearAttendance(eventId);
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

    const client = getSupabase();
    if (client) {
      try {
        await client.from("certificates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      } catch (err) {
        console.warn("Supabase wipeAllCertificates error:", err);
      }
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
          const mapped: TeamMember[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            position: d.position,
            committeeYear: d.committee_year,
            photoUrl: d.photo_url || "",
            approvedBio: d.approved_bio || "",
            isCurrent: d.is_current ?? true,
            orderIndex: d.order_index ?? 0,
          }));

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
          order_index: member.orderIndex ?? (index >= 0 ? index : list.length - 1),
        };

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(member.id);
        if (isUUID) {
          payload.id = member.id;
        }

        const { data: existing } = await client
          .from("team_members")
          .select("id")
          .eq("name", member.name)
          .eq("committee_year", member.committeeYear)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await client.from("team_members").update(payload).eq("id", existing.id);
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
        this.addCertificate(cert);
        newRegs.push(reg);
        newCerts.push(cert);
      });

      currentSr++;
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

  approveBatch(batchId: string, approverName: string): boolean {
    const batches = this.getBatches();
    const batch = batches.find((b) => b.id === batchId);
    if (!batch || batch.status !== "STAGED") return false;

    batch.status = "APPROVED";
    batch.approvedBy = approverName;
    batch.approvedAt = new Date().toISOString();
    this.setItem("batches", batches);

    // Convert staged rows to active certificates
    const currentCerts = this.getCertificates();
    batch.stagedRows.forEach((row) => {
      const newCert: CertificateRecord = {
        id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: row.code,
        recipientName: row.recipientName,
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
      };
      currentCerts.unshift(newCert);
    });
    this.setItem("certificates", currentCerts);

    // Log to Audit
    this.addAuditLog(
      approverName,
      "APPROVE_BATCH_PUBLISH",
      "upload_batches",
      batch.id,
      `Approved batch ${batch.filename}: published ${batch.rowCount} active certificates.`
    );

    return true;
  }

  // --- Option 2: Registrations & Payments ---
  getRegistrations(): Registration[] {
    return this.getItem("registrations", SEED_REGISTRATIONS);
  }

  async fetchRegistrations(eventId?: string): Promise<Registration[]> {
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
        if (data && !error) {
          const list: Registration[] = data.map((d: any) => ({
            id: d.id,
            eventId: d.event_id,
            privateToken: d.private_token,
            fullName: d.full_name,
            namePreference: d.name_display_preference || "FULL_NAME",
            email: d.email,
            phone: d.phone,
            rollNumber: d.roll_number,
            isIeeeMember: Boolean(d.is_ieee_member),
            ieeeMembershipNumber: d.ieee_membership_number,
            department: d.department,
            photoConsent: Boolean(d.photo_consent),
            status: d.status,
            ticketCode: d.ticket_code,
            createdAt: d.created_at,
          }));
          this.setItem("registrations", list);
          return list;
        }
      } catch (err) {
        console.warn("Supabase fetchRegistrations fallback:", err);
      }
    }
    return this.getRegistrations();
  }

  saveRegistrations(regs: Registration[]): void {
    this.setItem("registrations", regs);
  }

  async addRegistration(reg: Registration): Promise<void> {
    const list = this.getRegistrations();
    list.unshift(reg);
    this.setItem("registrations", list);

    const client = getSupabase();
    if (client) {
      try {
        const { error } = await client.from("registrations").insert({
          full_name: reg.fullName,
          name_display_preference: reg.namePreference || "FULL_NAME",
          email: reg.email,
          phone: reg.phone,
          roll_number: reg.rollNumber,
          is_ieee_member: reg.isIeeeMember,
          ieee_membership_number: reg.ieeeMembershipNumber,
          department: reg.department,
          photo_consent: reg.photoConsent,
          status: reg.status,
        });
        if (error) console.warn("Supabase addRegistration sync error:", error);
      } catch (err) {
        console.warn("Supabase addRegistration error:", err);
      }
    }
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
          team_name: c.teamName || null,
          project_title: c.projectTitle || null,
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
