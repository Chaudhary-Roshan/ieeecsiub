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
  AttendanceRecord
} from "@/types";
import { INITIAL_STAFF_USERS, CHAPTER_INFO } from "./constants";
import { supabase, isSupabaseConfigured } from "./supabase";
import { DEFAULT_CERTIFICATE_HTML } from "./defaultCertificateHtml";

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
];

// Seed Events
const SEED_EVENTS: EventItem[] = [
  {
    id: "evt-digitalfest-2026",
    slug: "2026/digitalfest-projects-expo",
    title: "IEEE DigitalFest 2026 – Projects Expo",
    description: "Premier student innovation expo featuring hardware prototypes, AI/ML systems, cybersecurity defenses, IoT devices, and software solutions evaluated by academic and industry judges.",
    learningObjectives: [
      "Cyber Physical Systems, Robotics & Embedded Hardware",
      "Artificial Intelligence, Machine Learning & Deep Neural Nets",
      "Cyber Security, Ethical Hacking & Defensive Hardening",
      "Internet of Things (IoT) & Next-Generation Computing",
      "Data Science, Big Data Analytics & Predictive Modeling",
      "Software Development, Cloud & Innovative Mobile Applications",
      "Emerging Technologies & Scalable System Architectures",
    ],
    targetAudience: "Undergraduate Engineering, Computer Science, IT & Software Engineering students with working prototypes",
    startDate: "2026-06-03T03:30:00Z",
    endDate: "2026-06-03T12:00:00Z",
    venue: "Department of Information & Communication Engineering, The Islamia University of Bahawalpur (IUB)",
    isOnline: false,
    status: "COMPLETED",
    seatsLimit: 120,
    registeredCount: 96,
    feePkr: 0,
    certificateType: "Certificate of Participation & Project Merit",
    certificateRule: "Successfully set up project booth, demonstrated functional prototype, and presented project to evaluation jury at the Expo",
    vtoolsId: "vtools-evt-10492",
    vtoolsLink: "https://events.vtools.ieee.org/m/10492",
    featuredImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    eventReport: "IEEE DigitalFest 2026 – Projects Expo concluded with grand success at the Department of Information & Communication Engineering, IUB. Over 60 student teams demonstrated working hardware & software prototypes across 7 tech domains. Organized in collaboration with IEEE Bahawalpur Subsection, IEEE CS, IEEE SPS, IEEE ComSoc, and Cyber Security Student Club under the leadership of Muhammad Roshan Ashraf. Cash prizes of Rs. 10,000 (1st Position), Rs. 5,000 (2nd Position), and Rs. 3,000 (3rd Position) awarded alongside official IEEE & IUB participation certificates.",
    galleryImages: [
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
    ],
    speakers: [
      {
        name: "Muhammad Roshan Ashraf",
        role: "President, Cyber Security Student Club & Event Lead",
        bio: "Led project organization, evaluation criteria, and event operations for IEEE DigitalFest 2026.",
      },
      {
        name: "Dr. Asjad Amin",
        role: "Branch Counselor & Faculty Jury Chair",
        bio: "Presided over the project judging session and closing award distribution ceremony.",
      },
      {
        name: "Support Desk: M. Talha, Aliza Kashif, Sharjeel Ibtisam",
        role: "Project Logistics & Participant Support",
        bio: "Support helpline (+92-303-7357002), booth allocations, and judging coordination.",
      },
    ],
  },
];

// Clean Certificates Registry (Fetched in real time from database)
const SEED_CERTIFICATES: CertificateRecord[] = [];

// Seed Team
const SEED_TEAM: TeamMember[] = [
  {
    id: "team-1",
    name: "Dr. Asjad Amin",
    position: "Branch Counselor / Senior Advisor",
    committeeYear: "2026-2027",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    approvedBio: "Associate Professor and Branch Counselor for IEEE UCET-IUB Student Branch. Guiding chapter excellence and university-wide engineering leadership.",
    isCurrent: true,
  },
  {
    id: "team-2",
    name: "Dr. Aoun Muhammad",
    position: "Faculty Advisor",
    committeeYear: "2026-2027",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    approvedBio: "Assistant Professor, Department of Computer Science & Engineering, UCET. Dedicated to computing research, IEEE CS accreditation, and student research mentoring.",
    isCurrent: true,
  },
  {
    id: "team-3",
    name: "Muhammad Roshan Ashraf",
    position: "Chapter Chair",
    committeeYear: "2026-2027",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    approvedBio: "Leading chapter strategy, technical programs, and web infrastructure. Passionate about AI systems, software architecture, and developer education.",
    isCurrent: true,
  },
  {
    id: "team-4",
    name: "Fatima Noor",
    position: "Vice Chair & Content Lead",
    committeeYear: "2026-2027",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    approvedBio: "Overseeing chapter communications, technical reporting, and workshop moderation.",
    isCurrent: true,
  },
  {
    id: "team-5",
    name: "Hamza Tariq",
    position: "Treasurer",
    committeeYear: "2026-2027",
    photoUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
    approvedBio: "Managing transparent financial records, workshop budgeting, and official payment reconciliations.",
    isCurrent: true,
  },
  {
    id: "team-6",
    name: "Ayesha Siddiqa",
    position: "General Secretary",
    committeeYear: "2026-2027",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    approvedBio: "Responsible for IEEE vTools reporting, executive documentation, and meeting minutes.",
    isCurrent: true,
  },
  // Archive member
  {
    id: "team-arch-1",
    name: "Usman Ghani",
    position: "Former Chapter Chair (2025)",
    committeeYear: "2025-2026",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    approvedBio: "Pioneered early chapter initiatives and student branch collaboration in 2025.",
    isCurrent: false,
  },
];

// Clean Upload Batches (Fetched in real time from database)
const SEED_BATCHES: UploadBatch[] = [];

// Clean Event Registrations & Tickets (Fetched in real time from database)
const SEED_REGISTRATIONS: Registration[] = [];

// Clean Payment Proofs (Fetched in real time from database)
const SEED_PAYMENTS: PaymentProof[] = [];

// Clean Audit Logs (Fetched in real time from database)
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
      localStorage.removeItem("ieee_cs_events");
      localStorage.setItem("ieee_cs_cache_version", "v4_clean_realtime");
    } catch (e) {
      console.error("Purge error:", e);
    }
  }

  private getItem<T>(key: string, fallback: T): T {
    if (!this.isBrowser()) return fallback;
    try {
      if (localStorage.getItem("ieee_cs_cache_version") !== "v4_clean_realtime") {
        this.purgeAllTestData();
        return fallback;
      }
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

    if (supabase) {
      try {
        const { data, error } = await supabase
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
            eventTitle: data.event_title,
            certificateType: data.certificate_type,
            recognitionLevel: (data.recognition_level as any) || "CHAPTER_RECOGNITION",
            issuerStatement: data.issuer_statement || CHAPTER_INFO.issuerStatementDefault,
            activityDate: data.activity_date,
            issueDate: data.issue_date,
            approverName: data.approver_name,
            approverRole: data.approver_role,
            status: data.status,
            source: data.source,
            batchId: data.batch_id,
            replacedByCode: data.replaced_by_code,
            replacementReason: data.replacement_reason,
            revocationDate: data.revocation_date,
            revocationReason: data.revocation_reason,
            sha256Fingerprint: data.sha256_fingerprint,
            pdfUrl: data.pdf_url,
            createdAt: data.created_at,
          };
          // Also cache locally
          this.updateCertificate(clean, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase fetchCertificateByCode fallback to local:", err);
      }
    }

    return this.getCertificateByCode(clean);
  }

  async fetchCertificates(): Promise<CertificateRecord[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("certificates")
          .select("*")
          .order("created_at", { ascending: false });
        if (data && !error) {
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

  addCertificate(cert: CertificateRecord): void {
    const list = this.getCertificates();
    list.unshift(cert);
    this.setItem("certificates", list);

    if (supabase) {
      supabase.from("certificates").upsert({
        code: cert.code,
        recipient_name: cert.recipientName,
        public_name_format: cert.publicNameFormat,
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
        replaced_by_code: cert.replacedByCode,
        replacement_reason: cert.replacementReason,
        revocation_date: cert.revocationDate,
        revocation_reason: cert.revocationReason,
        sha256_fingerprint: cert.sha256Fingerprint,
        pdf_url: cert.pdfUrl,
      }).then(({ error }) => {
        if (error) console.warn("Supabase addCertificate sync error:", error);
      });
    }
  }

  updateCertificate(code: string, updates: Partial<CertificateRecord>): boolean {
    const list = this.getCertificates();
    const index = list.findIndex((c) => c.code.toUpperCase() === code.trim().toUpperCase());
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

    if (supabase) {
      const payload: Record<string, any> = {};
      if (updates.status) payload.status = updates.status;
      if (updates.recipientName) payload.recipient_name = updates.recipientName;
      if (updates.replacedByCode) payload.replaced_by_code = updates.replacedByCode;
      if (updates.replacementReason) payload.replacement_reason = updates.replacementReason;
      if (updates.revocationDate) payload.revocation_date = updates.revocationDate;
      if (updates.revocationReason) payload.revocation_reason = updates.revocationReason;
      if (updates.sha256Fingerprint) payload.sha256_fingerprint = updates.sha256Fingerprint;

      if (Object.keys(payload).length > 0) {
        supabase
          .from("certificates")
          .update(payload)
          .eq("code", code.trim().toUpperCase())
          .then(({ error }) => {
            if (error) console.warn("Supabase updateCertificate sync error:", error);
          });
      }
    }

    return true;
  }

  // --- Events ---
  getEvents(): EventItem[] {
    return this.getItem("events", SEED_EVENTS);
  }

  async fetchEvents(): Promise<EventItem[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("start_date", { ascending: false });
        if (data && !error && data.length > 0) {
          const mapped: EventItem[] = data.map((d: any) => ({
            id: d.id,
            slug: d.slug,
            title: d.title,
            description: d.description,
            learningObjectives: typeof d.learning_objectives === "string" ? d.learning_objectives.split("\n") : (d.learning_objectives || []),
            targetAudience: d.target_audience,
            startDate: d.start_date,
            endDate: d.end_date,
            venue: d.venue,
            isOnline: Boolean(d.is_online),
            meetingLink: d.meeting_link,
            status: d.status,
            statusReason: d.status_reason,
            seatsLimit: d.seats_limit,
            feePkr: Number(d.fee_pkr || 0),
            paymentInstructions: d.payment_instructions,
            certificateType: d.certificate_type,
            certificateRule: d.certificate_rule,
            vtoolsId: d.vtools_id,
            vtoolsLink: d.vtools_link,
            featuredImage: d.featured_image,
            galleryImages: d.gallery_images || [],
            eventReport: d.event_report,
          }));
          this.setItem("events", mapped);
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase fetchEvents fallback to local:", err);
      }
    }
    return this.getEvents();
  }

  getEventBySlug(slug: string): EventItem | undefined {
    const list = this.getEvents();
    return list.find((e) => e.slug === slug || e.slug.endsWith(slug));
  }

  async fetchEventBySlug(slug: string): Promise<EventItem | undefined> {
    const clean = slug.replace(/^\/+/, "");
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .or(`slug.eq.${clean},slug.eq.2026/${clean}`)
          .maybeSingle();
        if (data && !error && data) {
          return {
            id: data.id,
            slug: data.slug,
            title: data.title,
            description: data.description,
            learningObjectives: typeof data.learning_objectives === "string" ? data.learning_objectives.split("\n") : (data.learning_objectives || []),
            targetAudience: data.target_audience,
            startDate: data.start_date,
            endDate: data.end_date,
            venue: data.venue,
            isOnline: Boolean(data.is_online),
            meetingLink: data.meeting_link,
            status: data.status,
            statusReason: data.status_reason,
            seatsLimit: data.seats_limit,
            feePkr: Number(data.fee_pkr || 0),
            paymentInstructions: data.payment_instructions,
            certificateType: data.certificate_type,
            certificateRule: data.certificate_rule,
            vtoolsId: data.vtools_id,
            vtoolsLink: data.vtools_link,
            featuredImage: data.featured_image,
            galleryImages: data.gallery_images || [],
            eventReport: data.event_report,
          };
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

  addEvent(event: EventItem): void {
    const list = this.getEvents();
    // Prevent duplicate ID/slug
    const filtered = list.filter((e) => e.id !== event.id && e.slug !== event.slug);
    filtered.unshift(event);
    this.setItem("events", filtered);

    if (supabase) {
      supabase.from("events").upsert({
        slug: event.slug,
        title: event.title,
        description: event.description,
        learning_objectives: event.learningObjectives?.join("\n") || "",
        target_audience: event.targetAudience || "",
        start_date: event.startDate,
        end_date: event.endDate,
        venue: event.venue,
        is_online: event.isOnline,
        meeting_link: event.meetingLink,
        status: event.status,
        status_reason: event.statusReason,
        seats_limit: event.seatsLimit,
        fee_pkr: event.feePkr,
        payment_instructions: event.paymentInstructions,
        certificate_type: event.certificateType,
        certificate_rule: event.certificateRule,
        vtools_id: event.vtoolsId,
        vtools_link: event.vtoolsLink,
        featured_image: event.featuredImage,
      }).then(({ error }) => {
        if (error) console.warn("Supabase addEvent sync error:", error);
      });
    }
  }

  updateEvent(id: string, updates: Partial<EventItem>): boolean {
    const list = this.getEvents();
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return false;

    list[index] = { ...list[index], ...updates };
    this.setItem("events", list);

    if (supabase) {
      const payload: Record<string, any> = {};
      if (updates.title) payload.title = updates.title;
      if (updates.description) payload.description = updates.description;
      if (updates.status) payload.status = updates.status;
      if (updates.statusReason) payload.status_reason = updates.statusReason;
      if (updates.startDate) payload.start_date = updates.startDate;
      if (updates.endDate) payload.end_date = updates.endDate;
      if (updates.venue) payload.venue = updates.venue;
      if (updates.feePkr !== undefined) payload.fee_pkr = updates.feePkr;
      if (updates.certificateType) payload.certificate_type = updates.certificateType;
      if (updates.certificateRule) payload.certificate_rule = updates.certificateRule;
      if (updates.featuredImage) payload.featured_image = updates.featuredImage;

      if (Object.keys(payload).length > 0) {
        supabase
          .from("events")
          .update(payload)
          .eq("slug", list[index].slug)
          .then(({ error }) => {
            if (error) console.warn("Supabase updateEvent sync error:", error);
          });
      }
    }

    return true;
  }

  deleteEvent(id: string): boolean {
    const list = this.getEvents();
    const target = list.find((e) => e.id === id);
    if (!target) return false;

    const filtered = list.filter((e) => e.id !== id);
    this.setItem("events", filtered);

    if (supabase) {
      supabase
        .from("events")
        .delete()
        .eq("slug", target.slug)
        .then(({ error }) => {
          if (error) console.warn("Supabase deleteEvent sync error:", error);
        });
    }

    return true;
  }

  // --- Certificate Templates ---
  getTemplates(): CertificateTemplate[] {
    return this.getItem("certificate_templates", SEED_TEMPLATES);
  }

  getTemplateById(id: string): CertificateTemplate | undefined {
    return this.getTemplates().find((t) => t.id === id);
  }

  saveTemplate(tpl: CertificateTemplate): void {
    const list = this.getTemplates();
    const index = list.findIndex((t) => t.id === tpl.id);
    if (index >= 0) {
      list[index] = tpl;
    } else {
      list.unshift(tpl);
    }
    this.setItem("certificate_templates", list);

    if (supabase) {
      supabase.from("certificate_templates").upsert({
        name: tpl.name,
        html_content: tpl.htmlContent,
        is_active: true,
      }).then(({ error }) => {
        if (error) console.warn("Supabase saveTemplate sync error:", error);
      });
    }
  }

  deleteTemplate(id: string): boolean {
    const list = this.getTemplates();
    if (list.length <= 1) return false; // keep at least default
    const filtered = list.filter((t) => t.id !== id);
    this.setItem("certificate_templates", filtered);
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
    return regs.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      name: r.fullName,
      rollNumber: r.rollNumber,
      email: r.email,
      attended: r.status === "ATTENDED",
      certificateCode: r.ticketCode ? `CSIUB-26-${r.ticketCode.slice(-4)}-AUTO` : undefined,
      checkedInAt: r.checkedInAt,
    }));
  }

  saveAttendance(eventId: string, records: AttendanceRecord[]): void {
    const stored = this.getItem<Record<string, AttendanceRecord[]>>("attendance_records", {});
    stored[eventId] = records;
    this.setItem("attendance_records", stored);
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

  // --- Team ---
  getTeamMembers(): TeamMember[] {
    return this.getItem("team", SEED_TEAM);
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

  async fetchRegistrations(): Promise<Registration[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("registrations")
          .select("*")
          .order("created_at", { ascending: false });
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

  addRegistration(reg: Registration): void {
    const list = this.getRegistrations();
    list.unshift(reg);
    this.setItem("registrations", list);

    if (supabase) {
      supabase.from("registrations").insert({
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
      }).then(({ error }) => {
        if (error) console.warn("Supabase addRegistration sync error:", error);
      });
    }
  }

  getPayments(): PaymentProof[] {
    return this.getItem("payments", SEED_PAYMENTS);
  }

  async fetchPayments(): Promise<PaymentProof[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
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
    if (supabase) {
      try {
        const { data, error } = await supabase
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

    if (supabase) {
      supabase.from("audit_logs").insert({
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

  // Reset database back to default seed state
  resetAll(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem("ieee_cs_certificates");
    localStorage.removeItem("ieee_cs_events");
    localStorage.removeItem("ieee_cs_team");
    localStorage.removeItem("ieee_cs_batches");
    localStorage.removeItem("ieee_cs_registrations");
    localStorage.removeItem("ieee_cs_payments");
    localStorage.removeItem("ieee_cs_audit_logs");
  }
}

export const db = new ChapterDatabase();
