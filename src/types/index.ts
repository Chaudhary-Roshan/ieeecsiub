export type CertificateStatus = "ACTIVE" | "REVOKED" | "REPLACED";
export type CertificateSource = "UPLOAD_REGISTRY" | "IN_SITE_GENERATED" | "LEGACY_IMPORT";

export type EventStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "POSTPONED" | "CANCELLED";

export type StaffRole = "ADMIN" | "SITE_ADMIN";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  twoFactorEnabled: boolean;
  tenureStart: string;
  tenureEnd: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  committeeYear: string;
  photoUrl: string;
  approvedBio: string;
  isCurrent: boolean;
  email?: string;
  linkedinUrl?: string;
  orderIndex?: number;
}

export interface EventItem {
  id: string;
  slug: string; // e.g. "2026/flutter-workshop"
  title: string;
  description: string;
  learningObjectives?: string[];
  targetAudience?: string;
  startDate: string; // ISO string (UTC)
  endDate: string; // ISO string (UTC)
  venue: string;
  isOnline: boolean;
  meetingLink?: string;
  status: EventStatus;
  statusReason?: string; // Reason if postponed or cancelled
  seatsLimit?: number;
  registeredCount?: number;
  registrationDeadline?: string;
  feePkr: number;
  paymentInstructions?: string;
  certificateType: string;
  certificateRule: string; // e.g. "Attend both days and submit final lab assignment"
  vtoolsId?: string;
  vtoolsLink?: string;
  featuredImage: string;
  galleryImages?: string[];
  eventReport?: string;
  speakers?: {
    name: string;
    role: string;
    bio: string;
    photoUrl?: string;
  }[];
  teams?: EventTeam[];
}

export interface EventTeam {
  id: string;
  eventId: string;
  sr: number;
  teamName: string;
  projectTitle: string;
  teamLeader: string;
  semester: string;
  memberCount: number;
  teamMembers: string[];
  projectDomain?: string;
  positionAward?: string; // e.g. "1st Position", "2nd Position", "3rd Position", "Finalist", "Participant"
  demoUrl?: string;
  createdAt?: string;
}

export interface CertificateRecord {
  id: string;
  code: string; // e.g. "CSIUB-26-7K3M-Q9TD"
  recipientName: string;
  publicNameFormat: "FULL_NAME" | "FIRST_INITIAL";
  eventId: string;
  eventTitle: string;
  certificateType: string; // e.g. "Certificate of Participation", "Certificate of Appreciation"
  recognitionLevel: "CHAPTER_RECOGNITION" | "JOINT_RECOGNITION";
  partnerName?: string;
  issuerStatement: string; // "This is a chapter recognition, not an IEEE credential."
  activityDate: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD
  approverName: string;
  approverRole: string; // "Chapter Chair", "Faculty Advisor"
  status: CertificateStatus;
  source: CertificateSource;
  batchId?: string;
  replacedByCode?: string;
  replacementReason?: string;
  revocationDate?: string;
  revocationReason?: string;
  sha256Fingerprint?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface UploadBatch {
  id: string;
  filename: string;
  eventId: string;
  eventTitle: string;
  rowCount: number;
  uploadedBy: string;
  uploadedAt: string;
  status: "STAGED" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: string;
  stagedRows: {
    recipientName: string;
    certificateType: string;
    code: string;
  }[];
}

export interface Registration {
  id: string;
  eventId: string;
  privateToken: string;
  fullName: string;
  namePreference: "FULL_NAME" | "FIRST_INITIAL";
  email: string;
  phone?: string;
  rollNumber: string;
  isIeeeMember: boolean;
  ieeeMembershipNumber?: string;
  department: string;
  photoConsent: boolean;
  status: "REGISTERED" | "PAYMENT_PENDING" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  ticketCode?: string;
  checkedInAt?: string;
  paymentId?: string;
  createdAt: string;
}

export interface PaymentProof {
  id: string;
  registrationId: string;
  recipientName: string;
  eventTitle: string;
  amountPkr: number;
  paymentMethod: "Raast" | "Bank Transfer" | "EasyPaisa / JazzCash";
  transactionId: string;
  proofImageUrl: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  staffUser: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  htmlContent: string;
  isDefault: boolean;
  chairSignatureUrl?: string;
  advisorSignatureUrl?: string;
  chairName?: string;
  chairTitle?: string;
  advisorName?: string;
  advisorTitle?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  name: string;
  rollNumber?: string;
  email?: string;
  attended: boolean;
  certificateCode?: string;
  checkedInAt?: string;
}
