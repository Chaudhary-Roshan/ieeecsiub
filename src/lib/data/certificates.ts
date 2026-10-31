import { createClient } from "@/lib/supabase/server";
import { CertificateRecord } from "@/types";

export async function getCertificates(): Promise<CertificateRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch certificates from Supabase:", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    code: row.code,
    recipientName: row.recipient_name,
    publicNameFormat: row.public_name_format || "FULL_NAME",
    eventId: row.event_id || "",
    eventTitle: row.event_name || "",
    certificateType: row.certificate_type || "Certificate of Participation",
    recognitionLevel: row.recognition_level || "CHAPTER_RECOGNITION",
    partnerName: row.partner_name || undefined,
    issuerStatement: row.issuer_statement || "This is a chapter recognition, not an IEEE credential.",
    activityDate: row.event_date || new Date().toISOString().slice(0, 10),
    issueDate: row.issue_date || new Date().toISOString().slice(0, 10),
    approverName: row.approver_name || "Chapter Chair",
    approverRole: row.approver_role || "Chapter Chair",
    status: row.status || "ACTIVE",
    source: row.source || "IN_SITE_GENERATED",
    batchId: row.batch_id || undefined,
    templateId: row.template_id || "classic-participation",
    teamName: row.team_name || undefined,
    projectTitle: row.project_title || undefined,
    replacedByCode: row.replaced_by_code || undefined,
    replacementReason: row.replacement_reason || undefined,
    revocationDate: row.revoked_at || undefined,
    revocationReason: row.revoke_reason || undefined,
    sha256Fingerprint: row.sha256_hash || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  }));
}

export async function verifyCertificateByCode(code: string) {
  const supabase = await createClient();
  const cleanCode = code.trim().toUpperCase();

  // Call the dedicated PostgreSQL verification RPC
  const { data, error } = await supabase.rpc("verify_certificate", {
    cert_code: cleanCode,
  });

  if (error || !data || !data.found) {
    return null;
  }

  return data;
}
