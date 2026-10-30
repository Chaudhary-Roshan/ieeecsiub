import { 
  CertificateRecord, 
  EventItem, 
  TeamMember, 
  UploadBatch, 
  Registration, 
  PaymentProof, 
  AuditLogItem, 
  StaffUser 
} from "@/types";
import { INITIAL_STAFF_USERS, CHAPTER_INFO } from "./constants";
import { supabase, isSupabaseConfigured } from "./supabase";

// Seed Events
const SEED_EVENTS: EventItem[] = [
  {
    id: "evt-1",
    slug: "2026/hands-on-ai-agents",
    title: "Hands-on Modern AI Agent Development with Next.js & Python",
    description: "Deep dive into building autonomous agentic workflows, function calling, and full-stack integration with Next.js and Supabase.",
    learningObjectives: [
      "Understand multi-turn agent execution and tool calling",
      "Integrate vector databases and embeddings",
      "Deploy scalable AI applications on Vercel and Supabase",
    ],
    targetAudience: "CS & SE undergraduate students, developers, and AI enthusiasts",
    startDate: "2026-11-15T09:00:00Z",
    endDate: "2026-11-16T17:00:00Z",
    venue: "Syed Tabish Alwari Auditorium & CS Lab 2, UCET IUB",
    isOnline: false,
    status: "UPCOMING",
    seatsLimit: 60,
    registeredCount: 38,
    registrationDeadline: "2026-11-10T23:59:59Z",
    feePkr: 500,
    paymentInstructions: "Transfer PKR 500 via Raast (ID: 0300-1234567) or Bank Alfalah Account: 0123-100456789. Upload screenshot proof with transaction ID.",
    certificateType: "Certificate of Completion",
    certificateRule: "Must attend all 4 technical sessions and submit the capstone agent repository",
    vtoolsId: "vtools-evt-10948",
    vtoolsLink: "https://events.vtools.ieee.org/m/10948",
    featuredImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    speakers: [
      {
        name: "Engr. Hamza Khan",
        role: "Senior AI Engineer, EnlivenAI",
        bio: "Specialist in agentic architectures, LangChain, and distributed LLM serving systems.",
      },
    ],
  },
  {
    id: "evt-2",
    slug: "2026/fullstack-bootcamp",
    title: "Full-Stack Web Bootcamp: Next.js & Supabase Architecture",
    description: "Master high-performance React frameworks, PostgreSQL Row Level Security (RLS), and server actions.",
    learningObjectives: [
      "Next.js App Router patterns & Server Components",
      "PostgreSQL schema design & RLS policies in Supabase",
      "Production deployment and CI/CD pipelines",
    ],
    targetAudience: "Students with basic JavaScript/React knowledge",
    startDate: "2026-11-28T10:00:00Z",
    endDate: "2026-11-29T16:00:00Z",
    venue: "Main Computer Center, Baghdad-ul-Jadeed Campus",
    isOnline: false,
    status: "UPCOMING",
    seatsLimit: 50,
    registeredCount: 22,
    registrationDeadline: "2026-11-25T23:59:59Z",
    feePkr: 300,
    paymentInstructions: "Raast ID: 0300-1234567. Provide transaction ID and transaction slip screenshot.",
    certificateType: "Certificate of Participation",
    certificateRule: "Minimum 80% physical attendance verified via digital QR check-in",
    vtoolsId: "vtools-evt-10950",
    vtoolsLink: "https://events.vtools.ieee.org/m/10950",
    featuredImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    speakers: [
      {
        name: "Muhammad Roshan Ashraf",
        role: "Lead Full-Stack Developer & Chapter Chair",
        bio: "Full stack engineer specializing in TypeScript, Next.js, and cloud backends.",
      },
    ],
  },
  {
    id: "evt-3",
    slug: "2026/flutter-workshop",
    title: "Hands-on Flutter & Cloud Mobile Development",
    description: "Two-day comprehensive hands-on workshop covering Dart, Flutter state management, and real-time backend integration.",
    learningObjectives: [
      "State management with Riverpod",
      "Connecting Flutter apps to Supabase REST & WebSockets",
      "Building responsive mobile UIs for Android & iOS",
    ],
    targetAudience: "Undergraduate Engineering & CS students",
    startDate: "2026-03-14T09:00:00Z",
    endDate: "2026-03-15T17:00:00Z",
    venue: "CS Seminar Hall & Software Lab 1, UCET IUB",
    isOnline: false,
    status: "COMPLETED",
    seatsLimit: 50,
    registeredCount: 48,
    feePkr: 0,
    certificateType: "Certificate of Participation",
    certificateRule: "Attended both training days and completed the mobile UI assignment",
    vtoolsId: "vtools-evt-9821",
    vtoolsLink: "https://events.vtools.ieee.org/m/9821",
    featuredImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    eventReport: "The 2-day workshop concluded successfully with 45 attendees building and deploying working cross-platform mobile apps. Keynote address by Dr. Aoun Muhammad.",
    galleryImages: [
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "evt-4",
    slug: "2026/open-source-git",
    title: "Git & GitHub for Open Source Collaboration",
    description: "Hands-on practical session on Git workflows, branches, merge conflicts, pull requests, and contributing to open-source software.",
    startDate: "2026-02-20T10:00:00Z",
    endDate: "2026-02-20T14:00:00Z",
    venue: "UCET Computer Lab 1",
    isOnline: false,
    status: "COMPLETED",
    feePkr: 0,
    certificateType: "Certificate of Attendance",
    certificateRule: "Submitted PR to chapter practice repository",
    featuredImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
    eventReport: "Over 60 students created GitHub accounts and submitted their first open-source contributions. 52 certificates awarded.",
  },
  {
    id: "evt-5",
    slug: "2026/robotics-competition-camp",
    title: "National Robotics Competition Training Camp",
    description: "Hardware interfacing, Arduino/ESP32 programming, and sensor integration.",
    startDate: "2026-10-10T09:00:00Z",
    endDate: "2026-10-12T16:00:00Z",
    venue: "Robotics & Embedded Systems Lab, UCET IUB",
    isOnline: false,
    status: "POSTPONED",
    statusReason: "Campus schedule conflict with university midterm examinations. Rescheduled for late December 2026.",
    feePkr: 0,
    certificateType: "Certificate of Participation",
    certificateRule: "Full hardware track attendance",
    featuredImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "evt-6",
    slug: "2026/legacy-hardware-interfacing",
    title: "Legacy Microcontroller Lab Session",
    description: "Deep dive into 8051 legacy microcontroller programming.",
    startDate: "2026-04-10T10:00:00Z",
    endDate: "2026-04-10T15:00:00Z",
    venue: "Hardware Lab 3",
    isOnline: false,
    status: "CANCELLED",
    statusReason: "Laboratory hardware maintenance and renovation.",
    feePkr: 0,
    certificateType: "Certificate of Attendance",
    certificateRule: "Lab attendance",
    featuredImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  },
];

// Seed Certificates
const SEED_CERTIFICATES: CertificateRecord[] = [
  {
    id: "cert-1",
    code: "CSIUB-26-7K3M-Q9TC", // Valid sample code
    recipientName: "Ayesha Khan",
    publicNameFormat: "FULL_NAME",
    eventId: "evt-3",
    eventTitle: "Hands-on Flutter & Cloud Mobile Development",
    certificateType: "Certificate of Participation",
    recognitionLevel: "CHAPTER_RECOGNITION",
    issuerStatement: CHAPTER_INFO.issuerStatementDefault,
    activityDate: "2026-03-15",
    issueDate: "2026-03-18",
    approverName: "Dr. Aoun Muhammad",
    approverRole: "Faculty Advisor",
    status: "ACTIVE",
    source: "UPLOAD_REGISTRY",
    sha256Fingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    createdAt: "2026-03-18T10:00:00Z",
  },
  {
    id: "cert-2",
    code: "CSIUB-26-8J2N-K1RD",
    recipientName: "Ahmed Belal",
    publicNameFormat: "FULL_NAME",
    eventId: "evt-3",
    eventTitle: "Hands-on Flutter & Cloud Mobile Development",
    certificateType: "Certificate of Participation",
    recognitionLevel: "CHAPTER_RECOGNITION",
    issuerStatement: CHAPTER_INFO.issuerStatementDefault,
    activityDate: "2026-03-15",
    issueDate: "2026-03-18",
    approverName: "Dr. Aoun Muhammad",
    approverRole: "Faculty Advisor",
    status: "REPLACED",
    source: "UPLOAD_REGISTRY",
    replacedByCode: "CSIUB-26-9P4W-M8XB",
    replacementReason: "Correction of name spelling from 'Ahmed Belal' to 'Ahmad Bilal' per participant verified request.",
    createdAt: "2026-03-18T10:00:00Z",
  },
  {
    id: "cert-3",
    code: "CSIUB-26-9P4W-M8XB",
    recipientName: "Ahmad Bilal",
    publicNameFormat: "FULL_NAME",
    eventId: "evt-3",
    eventTitle: "Hands-on Flutter & Cloud Mobile Development",
    certificateType: "Certificate of Participation",
    recognitionLevel: "CHAPTER_RECOGNITION",
    issuerStatement: CHAPTER_INFO.issuerStatementDefault,
    activityDate: "2026-03-15",
    issueDate: "2026-03-22",
    approverName: "Dr. Aoun Muhammad",
    approverRole: "Faculty Advisor",
    status: "ACTIVE",
    source: "UPLOAD_REGISTRY",
    createdAt: "2026-03-22T14:30:00Z",
  },
  {
    id: "cert-4",
    code: "CSIUB-26-4L8X-Z2VC",
    recipientName: "Tariq Mahmood",
    publicNameFormat: "FULL_NAME",
    eventId: "evt-3",
    eventTitle: "Hands-on Flutter & Cloud Mobile Development",
    certificateType: "Certificate of Participation",
    recognitionLevel: "CHAPTER_RECOGNITION",
    issuerStatement: CHAPTER_INFO.issuerStatementDefault,
    activityDate: "2026-03-15",
    issueDate: "2026-03-18",
    approverName: "Dr. Aoun Muhammad",
    approverRole: "Faculty Advisor",
    status: "REVOKED",
    source: "UPLOAD_REGISTRY",
    revocationDate: "2026-04-02",
    revocationReason: "Issued inadvertently; candidate missed mandatory second-day practical evaluations and attendance criterion was unmet.",
    createdAt: "2026-03-18T10:00:00Z",
  },
  {
    id: "cert-5",
    code: "CSIUB-25-LEGC-001X",
    recipientName: "Zubair Ahmad",
    publicNameFormat: "FULL_NAME",
    eventId: "evt-4",
    eventTitle: "Git & GitHub for Open Source Collaboration",
    certificateType: "Certificate of Attendance",
    recognitionLevel: "CHAPTER_RECOGNITION",
    issuerStatement: CHAPTER_INFO.issuerStatementDefault,
    activityDate: "2026-02-20",
    issueDate: "2026-02-23",
    approverName: "Muhammad Roshan Ashraf",
    approverRole: "Chapter Chair",
    status: "ACTIVE",
    source: "LEGACY_IMPORT",
    createdAt: "2026-02-23T12:00:00Z",
  },
];

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

// Seed Upload Batches (Option 1 Staged Demo)
const SEED_BATCHES: UploadBatch[] = [
  {
    id: "batch-1",
    filename: "ai_agent_workshop_participants.csv",
    eventId: "evt-1",
    eventTitle: "Hands-on Modern AI Agent Development with Next.js & Python",
    rowCount: 2,
    uploadedBy: "Muhammad Roshan Ashraf",
    uploadedAt: "2026-10-29T15:30:00Z",
    status: "STAGED",
    stagedRows: [
      {
        recipientName: "Bilal Haider",
        certificateType: "Certificate of Completion",
        code: "CSIUB-26-3M7K-B1XQ",
      },
      {
        recipientName: "Zainab Bibi",
        certificateType: "Certificate of Completion",
        code: "CSIUB-26-9P2L-W4RT",
      },
    ],
  },
];

// Seed Option 2 Registrations & Payments
const SEED_REGISTRATIONS: Registration[] = [
  {
    id: "reg-1",
    eventId: "evt-1",
    privateToken: "a7f3e829bc0192d4f6e8a012",
    fullName: "Muhammad Daniyal",
    namePreference: "FULL_NAME",
    email: "daniyal@example.com",
    phone: "0300-9876543",
    rollNumber: "FA23-BCS-042",
    isIeeeMember: true,
    ieeeMembershipNumber: "98765432",
    department: "Computer Science",
    photoConsent: true,
    status: "CONFIRMED",
    ticketCode: "TCK-AI-9021",
    createdAt: "2026-10-25T11:20:00Z",
  },
  {
    id: "reg-2",
    eventId: "evt-1",
    privateToken: "f1c8e932aa784561b0c9e334",
    fullName: "Sana Tariq",
    namePreference: "FULL_NAME",
    email: "sana.t@example.com",
    phone: "0312-3456789",
    rollNumber: "SP24-BSE-019",
    isIeeeMember: false,
    department: "Software Engineering",
    photoConsent: true,
    status: "PAYMENT_PENDING",
    ticketCode: "TCK-AI-9022",
    createdAt: "2026-10-27T16:45:00Z",
  },
];

const SEED_PAYMENTS: PaymentProof[] = [
  {
    id: "pay-1",
    registrationId: "reg-2",
    recipientName: "Sana Tariq",
    eventTitle: "Hands-on Modern AI Agent Development with Next.js & Python",
    amountPkr: 500,
    paymentMethod: "Raast",
    transactionId: "RAAST-TX-99881234",
    proofImageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    status: "PENDING",
    createdAt: "2026-10-27T16:50:00Z",
  },
];

const SEED_AUDIT: AuditLogItem[] = [
  {
    id: "aud-1",
    staffUser: "roshan.ashraf@ieee.org (Site Admin)",
    action: "UPLOAD_BATCH_STAGED",
    entityType: "upload_batches",
    entityId: "batch-1",
    details: "Uploaded ai_agent_workshop_participants.csv (2 rows) awaiting Certificate Approver authorization",
    timestamp: "2026-10-29T15:30:00Z",
  },
  {
    id: "aud-2",
    staffUser: "aoun.muhammad@iub.edu.pk (Faculty Advisor)",
    action: "CERTIFICATE_REVOCATION",
    entityType: "certificates",
    entityId: "cert-4",
    details: "Revoked CSIUB-26-4L8X-Z2VC (Tariq Mahmood) due to incomplete attendance",
    timestamp: "2026-04-02T11:00:00Z",
  },
  {
    id: "aud-3",
    staffUser: "aoun.muhammad@iub.edu.pk (Faculty Advisor)",
    action: "CERTIFICATE_REPLACEMENT",
    entityType: "certificates",
    entityId: "cert-2",
    details: "Replaced CSIUB-26-8J2N-K1RD with CSIUB-26-9P4W-M8XB (name spelling correction)",
    timestamp: "2026-03-22T14:30:00Z",
  },
];

// Helper to access LocalStorage safely in Next.js
class ChapterDatabase {
  private isBrowser(): boolean {
    return typeof window !== "undefined";
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

  getEventBySlug(slug: string): EventItem | undefined {
    const list = this.getEvents();
    return list.find((e) => e.slug === slug || e.slug.endsWith(slug));
  }

  getEventById(id: string): EventItem | undefined {
    return this.getEvents().find((e) => e.id === id);
  }

  addEvent(event: EventItem): void {
    const list = this.getEvents();
    list.unshift(event);
    this.setItem("events", list);
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
        approverRole: "Certificate Approver",
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
        ieee_membership_number: reg.ieeeNumber,
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
