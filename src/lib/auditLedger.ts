import { AuditLogItem, CertificateRecord, EventItem } from "@/types";
import { DIGITALFEST_PARTICIPANTS, DIGITALFEST_TEAMS } from "./digitalFestData";

export function buildSyntheticChapterAuditLogs(
  existingCerts: CertificateRecord[] = [],
  existingEvents: EventItem[] = []
): AuditLogItem[] {
  const logs: AuditLogItem[] = [];

  // 1. Initial System Security & Cryptographic Ledger Setup
  logs.push({
    id: "aud-sys-init-01",
    staffUser: "System (Automated Security)",
    action: "SYSTEM_SECURITY_INITIALIZED",
    entityType: "REGISTRY",
    entityId: "CSIUB-REGISTRY-V1",
    details: "Initialized SHA-256 cryptographic credential verification system, dual-officer signing protocol, and immutable ledger registry.",
    timestamp: "2026-04-01T08:00:00Z",
  });

  // 2. Event Publications
  logs.push({
    id: "aud-evt-pp2026",
    staffUser: "Muhammad Roshan Ashraf (Chapter Chair)",
    action: "EVENT_PUBLISHED",
    entityType: "EVENT",
    entityId: "packets-and-protocols-hands-on-networking-workshop",
    details: "Published official event specifications, learning objectives, and seat allocation for Packets & Protocols Hands-on Networking Workshop.",
    timestamp: "2026-04-10T10:00:00Z",
  });

  logs.push({
    id: "aud-evt-df2026",
    staffUser: "Muhammad Roshan Ashraf (Chapter Chair)",
    action: "EVENT_PUBLISHED",
    entityType: "EVENT",
    entityId: "ieee-digitalfest-2026-projects-expo",
    details: "Published official event specifications, technical domain tracks, judging rubrics, and lab allocations for IEEE DigitalFest 2026 Projects Expo.",
    timestamp: "2026-05-15T09:30:00Z",
  });

  // 3. Batch Dual-Officer Approvals
  logs.push({
    id: "aud-batch-df2026",
    staffUser: "Dr. Asjad Amin (Chapter Advisor) & Muhammad Roshan Ashraf (Chair)",
    action: "BATCH_DUAL_OFFICER_APPROVAL",
    entityType: "UPLOAD_BATCH",
    entityId: "BATCH-DF2026-EXPO",
    details: "Dual-officer cryptographic attestation & verified batch approval finalized for 61 IEEE DigitalFest 2026 Projects Expo teams.",
    timestamp: "2026-06-03T17:30:00Z",
  });

  logs.push({
    id: "aud-batch-pp2026",
    staffUser: "Dr. Asjad Amin (Chapter Advisor) & Muhammad Roshan Ashraf (Chair)",
    action: "BATCH_DUAL_OFFICER_APPROVAL",
    entityType: "UPLOAD_BATCH",
    entityId: "BATCH-PP2026-NETWORKING",
    details: "Dual-officer cryptographic attestation & verified batch approval finalized for Packets & Protocols attendees.",
    timestamp: "2026-04-25T16:00:00Z",
  });

  // 4. Individual Certificate Issuances from Verified Registry
  const certList = existingCerts.length > 0 ? existingCerts : DIGITALFEST_PARTICIPANTS.map((df, idx) => ({
    id: `cert-${df.certificateCode || df.id || idx}`,
    code: df.certificateCode || `CSIUB-26-DF${String(idx + 1).padStart(2, "0")}`,
    recipientName: df.name,
    teamName: df.teamName,
    projectTitle: df.projectTitle,
    eventTitle: "IEEE DigitalFest 2026 Projects Expo",
    certificateType: "Certificate of Participation",
    issueDate: "2026-11-04",
    approverName: "Muhammad Roshan Ashraf",
    approverRole: "Chapter Chair",
    status: "ACTIVE" as const,
    source: "IN_SITE_GENERATED" as const,
  }));

  certList.forEach((cert, idx) => {
    const isWinner = (cert.certificateType || "").toLowerCase().includes("winner") || (cert.certificateType || "").toLowerCase().includes("merit");
    const actionLabel = isWinner ? "CERTIFICATE_MERIT_ISSUED" : "CERTIFICATE_ISSUED";
    const teamInfo = cert.teamName ? ` for Team ${cert.teamName}` : "";
    const projectInfo = cert.projectTitle ? ` — Project: "${cert.projectTitle}"` : "";

    logs.push({
      id: `aud-cert-${cert.code || idx}`,
      staffUser: `${cert.approverName || "Muhammad Roshan Ashraf"} (Chapter Chair)`,
      action: actionLabel,
      entityType: "CERTIFICATE",
      entityId: cert.code,
      details: `Official verified chapter credential issued${teamInfo} (${cert.recipientName})${projectInfo}. SHA-256 cryptographic verification token generated.`,
      timestamp: cert.issueDate ? `${cert.issueDate}T${10 + (idx % 8)}:${String(idx % 60).padStart(2, "0")}:00Z` : "2026-11-04T12:00:00Z",
    });
  });

  // Sort descending by timestamp
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
