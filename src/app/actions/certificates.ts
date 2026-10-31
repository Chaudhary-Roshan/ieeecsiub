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
