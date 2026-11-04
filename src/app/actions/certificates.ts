"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { generateCertificateCode } from "@/lib/codeGenerator";
import { CertificateRecord, CertificateStatus } from "@/types";

export interface GenerateWizardRow {
  recipientName: string;
  email?: string;
  rollNumber?: string;
  teamName?: string;
  isLeader?: boolean;
  projectTitle?: string;
  placement?: string;
  members?: string[];
  attended?: boolean;
}

export interface GenerateCertificatesPayload {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventYear?: number;
  templateId: string;
  mode: "PER_PERSON" | "PER_TEAM";
  certificateType: string;
  rows: GenerateWizardRow[];
}

export async function generateCertificatesAction(payload: GenerateCertificatesPayload) {
  const supabase = await createClient();

  const {
    eventId,
    eventName,
    eventDate,
    eventYear = new Date().getFullYear(),
    templateId,
    mode,
    certificateType,
    rows,
  } = payload;

  if (!rows || rows.length === 0) {
    throw new Error("No recipient rows provided for certificate generation.");
  }

  // 1. Create Certificate Run record for traceability and 24h undo
  const { data: runData, error: runError } = await supabase
    .from("certificate_runs")
    .insert({
      event_id: eventId || null,
      template: templateId,
      mode,
      rows_total: rows.length,
      rows_issued: 0,
      rows_skipped: 0,
    })
    .select()
    .single();

  const runId = runData?.id || `run-${Date.now()}`;

  let issuedCount = 0;
  let skippedCount = 0;
  const issuedCertificates: { name: string; code: string; verifyUrl: string }[] = [];

  for (const row of rows) {
    // If attended is explicitly false, skip
    if (row.attended === false) {
      skippedCount++;
      continue;
    }

    const recipientName = (row.recipientName || "").trim();
    const teamName = (row.teamName || "").trim();

    if (!recipientName && !teamName) {
      skippedCount++;
      continue;
    }

    // Check for duplicate already issued for this event + template + name
    const { data: existing } = await supabase
      .from("certificates")
      .select("id, code")
      .eq("event_name", eventName)
      .eq("template_id", templateId)
      .ilike("recipient_name", recipientName || teamName)
      .maybeSingle();

    if (existing?.id) {
      skippedCount++;
      continue;
    }

    const code = generateCertificateCode(eventYear.toString().slice(-2));
    const certPayload = {
      code,
      recipient_name: recipientName || teamName,
      recipient_email: row.email || null,
      role: row.placement ? "WINNER" : "PARTICIPANT",
      event_id: eventId || null,
      event_name: eventName,
      event_date: eventDate,
      event_year: eventYear,
      issue_date: new Date().toISOString().slice(0, 10),
      status: "ACTIVE",
      source: "IN_SITE_GENERATED",
      template_id: templateId,
      run_id: runId,
      team_name: teamName || null,
      team_leader: row.isLeader ? recipientName : null,
      project_title: row.projectTitle || null,
      placement: row.placement || null,
      certificate_type: certificateType,
      public_name_format: "FULL_NAME",
      created_at: new Date().toISOString(),
    };

    const { data: insertedCert, error: certError } = await supabase
      .from("certificates")
      .insert(certPayload)
      .select()
      .single();

    if (certError || !insertedCert) {
      console.error("Failed to insert certificate row:", certError?.message);
      skippedCount++;
      continue;
    }

    issuedCount++;
    issuedCertificates.push({
      name: recipientName || teamName,
      code,
      verifyUrl: `https://ieeecsiub.vercel.app/verify/${code}`,
    });

    // Insert team members if provided
    if (row.members && row.members.length > 0) {
      const memberInserts = row.members.map((m, idx) => ({
        certificate_id: insertedCert.id,
        position: idx + 1,
        member_name: m.trim(),
      }));
      await supabase.from("certificate_members").insert(memberInserts);
    }

    // Record in certificate_versions immutable ledger
    await supabase.from("certificate_versions").insert({
      certificate_id: insertedCert.id,
      code,
      action: "GENERATED",
      snapshot: certPayload,
      reason: "Initial issuance via Unified Certificate Wizard",
    });
  }

  // Update run stats
  await supabase
    .from("certificate_runs")
    .update({
      rows_issued: issuedCount,
      rows_skipped: skippedCount,
    })
    .eq("id", runId);

  try {
    revalidateTag("certificates");
  } catch {}
  revalidatePath("/verify");
  revalidatePath("/admin/certificates");

  return {
    success: true,
    runId,
    totalProcessed: rows.length,
    totalIssued: issuedCount,
    totalSkipped: skippedCount,
    issuedCertificates,
  };
}

export async function voidRunAction(runId: string) {
  const supabase = await createClient();

  // Find all certificates associated with run
  const { data: certs } = await supabase
    .from("certificates")
    .select("id, code")
    .eq("run_id", runId);

  if (certs && certs.length > 0) {
    for (const cert of certs) {
      await supabase
        .from("certificates")
        .update({ status: "VOID", revoke_reason: "Run voided by administrator within 24 hours" })
        .eq("id", cert.id);

      await supabase.from("certificate_versions").insert({
        certificate_id: cert.id,
        code: cert.code,
        action: "VOIDED",
        snapshot: { status: "VOID" },
        reason: "Run voided by administrator within 24 hours",
      });
    }
  }

  await supabase
    .from("certificate_runs")
    .update({ voided_at: new Date().toISOString() })
    .eq("id", runId);

  try {
    revalidateTag("certificates");
  } catch {}
  revalidatePath("/verify");
  revalidatePath("/admin/certificates");

  return { success: true, voidedCount: certs?.length ?? 0 };
}

export async function revokeCertificateAction(code: string, reason: string) {
  const supabase = await createClient();
  const cleanCode = code.trim().toUpperCase();

  const { data: cert } = await supabase
    .from("certificates")
    .select("id, code")
    .eq("code", cleanCode)
    .single();

  if (!cert) {
    throw new Error(`Certificate with code ${cleanCode} not found.`);
  }

  const { error } = await supabase
    .from("certificates")
    .update({
      status: "REVOKED",
      revoked_at: new Date().toISOString(),
      revoke_reason: reason.trim() || "Revoked by Chapter Administrator",
    })
    .eq("id", cert.id);

  if (error) {
    throw new Error(`Failed to revoke certificate: ${error.message}`);
  }

  await supabase.from("certificate_versions").insert({
    certificate_id: cert.id,
    code: cert.code,
    action: "REVOKED",
    snapshot: { status: "REVOKED", reason },
    reason,
  });

  try {
    revalidateTag("certificates");
  } catch {}
  revalidatePath("/verify");
  revalidatePath(`/verify/${cleanCode}`);
  revalidatePath("/admin/certificates");

  return { success: true };
}

export async function replaceCertificateAction(
  oldCode: string,
  newRecipientName: string,
  reason: string
) {
  const supabase = await createClient();
  const cleanOldCode = oldCode.trim().toUpperCase();

  const { data: oldCert } = await supabase
    .from("certificates")
    .select("*")
    .eq("code", cleanOldCode)
    .single();

  if (!oldCert) {
    throw new Error(`Certificate ${cleanOldCode} not found.`);
  }

  const newCode = generateCertificateCode("26");

  // Mark old certificate REPLACED
  await supabase
    .from("certificates")
    .update({
      status: "REPLACED",
      replaced_by_code: newCode,
      revoked_at: new Date().toISOString(),
      revoke_reason: reason.trim() || "Replaced with corrected certificate",
    })
    .eq("id", oldCert.id);

  // Insert new ACTIVE certificate
  const newPayload = {
    ...oldCert,
    id: undefined,
    code: newCode,
    recipient_name: newRecipientName.trim() || oldCert.recipient_name,
    status: "ACTIVE",
    issue_date: new Date().toISOString().slice(0, 10),
    replaced_by_code: null,
    revoked_at: null,
    revoke_reason: null,
    created_at: new Date().toISOString(),
  };

  const { data: newCert, error: newCertErr } = await supabase
    .from("certificates")
    .insert(newPayload)
    .select()
    .single();

  if (newCertErr || !newCert) {
    throw new Error(`Failed to create replacement certificate: ${newCertErr?.message}`);
  }

  await supabase.from("certificate_versions").insert({
    certificate_id: newCert.id,
    code: newCode,
    action: "REPLACED",
    snapshot: newPayload,
    reason: `Replaced previous certificate ${cleanOldCode}: ${reason}`,
  });

  try {
    revalidateTag("certificates");
  } catch {}
  revalidatePath("/verify");
  revalidatePath(`/verify/${cleanOldCode}`);
  revalidatePath(`/verify/${newCode}`);
  revalidatePath("/admin/certificates");

  return { success: true, newCode };
}

export async function bulkSaveCertificatesAction(
  certs: CertificateRecord[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!certs || certs.length === 0) return { success: true, count: 0 };
    const supabase = await createClient();

    const payload = certs.map((cert) => ({
      code: cert.code.trim().toUpperCase(),
      recipient_name: cert.recipientName || "Participant",
      recipient_roll_number: cert.recipientRollNumber || null,
      recipient_email: cert.recipientEmail || null,
      public_name_format: cert.publicNameFormat || "FULL_NAME",
      event_id: cert.eventId || null,
      event_title: cert.eventTitle || "UCET IUB Technical Session",
      certificate_type: cert.certificateType || "Certificate of Participation",
      recognition_level: cert.recognitionLevel || "CHAPTER_RECOGNITION",
      issuer_statement:
        cert.issuerStatement ||
        "In recognition of active participation and successful completion.",
      activity_date: cert.activityDate || new Date().toISOString().slice(0, 10),
      issue_date: cert.issueDate || new Date().toISOString().slice(0, 10),
      approver_name: cert.approverName || "Muhammad Roshan Ashraf",
      approver_role: cert.approverRole || "Chapter Chair",
      status: cert.status || "ACTIVE",
      source: cert.source || "IN_SITE_GENERATED",
      template_id: cert.templateId || null,
      team_name: cert.teamName || null,
      project_title: cert.projectTitle || null,
      replaced_by_code: cert.replacedByCode || null,
      replacement_reason: cert.replacementReason || null,
      revocation_date: cert.revocationDate || null,
      revocation_reason: cert.revocationReason || null,
      sha256_fingerprint: cert.sha256Fingerprint || null,
      pdf_url: cert.pdfUrl || null,
    }));

    // 1. Try PostgreSQL RPC
    const { data: rpcRes, error: rpcErr } = await supabase.rpc(
      "bulk_save_certificates",
      {
        p_certs: payload,
      }
    );

    if (!rpcErr && rpcRes && rpcRes.success) {
      try {
        revalidatePath("/verify");
        revalidatePath("/admin/certificates");
        revalidateTag("certificates");
      } catch {}
      return { success: true, count: certs.length };
    }

    // 2. Direct upsert fallback
    let lastError: string | null = null;
    let savedCount = 0;
    for (let i = 0; i < payload.length; i += 50) {
      const chunk = payload.slice(i, i + 50);
      const { error: upsertErr } = await supabase
        .from("certificates")
        .upsert(chunk, { onConflict: "code" });
      if (upsertErr) {
        lastError = upsertErr.message;
        console.error("Direct certificates upsert error:", upsertErr.message);
      } else {
        savedCount += chunk.length;
      }
    }

    if (lastError && savedCount === 0) {
      return { success: false, count: 0, error: lastError };
    }

    try {
      revalidatePath("/verify");
      revalidatePath("/admin/certificates");
      revalidateTag("certificates");
    } catch {}

    return { success: true, count: savedCount };
  } catch (err: any) {
    console.error("bulkSaveCertificatesAction error:", err);
    return {
      success: false,
      count: 0,
      error: err?.message || "Failed to bulk save certificates.",
    };
  }
}

export async function verifyCertificateAction(
  code: string
): Promise<CertificateRecord | null> {
  try {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    const supabase = await createClient();

    // 1. Try verify_certificate RPC
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "verify_certificate",
      {
        cert_code: clean,
      }
    );

    if (rpcData && !rpcErr && rpcData.found) {
      return {
        id: rpcData.code,
        code: rpcData.code,
        recipientName: rpcData.recipient_name || rpcData.recipientName,
        recipientRollNumber:
          rpcData.recipient_roll_number ||
          rpcData.recipientRollNumber ||
          undefined,
        recipientEmail:
          rpcData.recipient_email || rpcData.recipientEmail || undefined,
        publicNameFormat: "FULL_NAME",
        eventId: "",
        eventTitle:
          rpcData.event_title ||
          rpcData.event_name ||
          rpcData.eventTitle ||
          "IEEE Technical Session",
        certificateType:
          rpcData.certificate_type ||
          rpcData.certificateType ||
          "Certificate of Participation",
        recognitionLevel:
          (rpcData.recognition_level as any) || "CHAPTER_RECOGNITION",
        issuerStatement:
          rpcData.issuer_statement ||
          "In recognition of active participation and successful completion.",
        activityDate: rpcData.activity_date || rpcData.event_date || "",
        issueDate: rpcData.issue_date || "",
        approverName: rpcData.approver_name || "Muhammad Roshan Ashraf",
        approverRole: rpcData.approver_role || "Chapter Chair",
        status: rpcData.status || "ACTIVE",
        source: "IN_SITE_GENERATED",
        teamName: rpcData.team_name || undefined,
        projectTitle: rpcData.project_title || undefined,
        replacedByCode: rpcData.replaced_by_code || undefined,
        replacementReason: rpcData.replacement_reason || undefined,
        revocationDate: rpcData.revocation_date || undefined,
        revocationReason: rpcData.revocation_reason || undefined,
        sha256Fingerprint: rpcData.sha256_hash || undefined,
        pdfUrl: rpcData.pdf_url || undefined,
        createdAt: rpcData.issue_date || new Date().toISOString(),
      };
    }

    // 2. Direct select fallback by code, roll number, or email
    let { data: row } = await supabase
      .from("certificates")
      .select("*")
      .eq("code", clean)
      .maybeSingle();

    if (!row) {
      const { data: altRow } = await supabase
        .from("certificates")
        .select("*")
        .or(`recipient_roll_number.ilike.${clean},recipient_email.ilike.${clean}`)
        .maybeSingle();
      row = altRow;
    }

    if (row) {
      return {
        id: row.id,
        code: row.code,
        recipientName: row.recipient_name,
        recipientRollNumber: row.recipient_roll_number || undefined,
        recipientEmail: row.recipient_email || undefined,
        publicNameFormat: (row.public_name_format as any) || "FULL_NAME",
        eventId: row.event_id || "",
        eventTitle: row.event_title || "IEEE Technical Session",
        certificateType: row.certificate_type || "Certificate of Participation",
        recognitionLevel:
          (row.recognition_level as any) || "CHAPTER_RECOGNITION",
        issuerStatement:
          row.issuer_statement ||
          "In recognition of active participation and successful completion.",
        activityDate: row.activity_date || "",
        issueDate: row.issue_date || "",
        approverName: row.approver_name || "Muhammad Roshan Ashraf",
        approverRole: row.approver_role || "Chapter Chair",
        status: row.status || "ACTIVE",
        source: row.source || "IN_SITE_GENERATED",
        templateId: row.template_id || undefined,
        teamName: row.team_name || undefined,
        projectTitle: row.project_title || undefined,
        replacedByCode: row.replaced_by_code || undefined,
        replacementReason: row.replacement_reason || undefined,
        revocationDate: row.revocation_date || undefined,
        revocationReason: row.revocation_reason || undefined,
        sha256Fingerprint: row.sha256_fingerprint || undefined,
        pdfUrl: row.pdf_url || undefined,
        createdAt: row.created_at || new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.warn("verifyCertificateAction error:", err);
    return null;
  }
}

