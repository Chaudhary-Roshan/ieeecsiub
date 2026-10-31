"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";

export interface RegisterForEventParams {
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  rollNumber?: string;
  department?: string;
  isIeeeMember?: boolean;
  ieeeNumber?: string;
}

export async function registerForEventAction(params: RegisterForEventParams) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("register_for_event", {
    p_event_id: params.eventId,
    p_full_name: params.fullName,
    p_email: params.email,
    p_phone: params.phone,
    p_roll_number: params.rollNumber || null,
    p_department: params.department || "Computer Science",
    p_is_ieee_member: Boolean(params.isIeeeMember),
    p_ieee_number: params.ieeeNumber || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Registration failed.");
  }

  try {
    revalidateTag("events");
  } catch {}
  revalidatePath("/events");
  revalidatePath(`/admin/attendance`);

  return data;
}

export async function submitPaymentAction(params: {
  privateToken: string;
  method: string;
  transactionId: string;
  proofPath: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_payment", {
    p_private_token: params.privateToken,
    p_method: params.method,
    p_transaction_id: params.transactionId,
    p_proof_path: params.proofPath,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Payment submission failed.");
  }

  revalidatePath("/admin/payments");
  return data;
}

export async function verifyPaymentAction(params: {
  paymentId: string;
  decision: "VERIFIED" | "REJECTED";
  reason?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("verify_payment", {
    p_payment_id: params.paymentId,
    p_decision: params.decision,
    p_reason: params.reason || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Verification update failed.");
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/attendance");
  return data;
}

export async function checkInTicketAction(ticketCode: string, reason?: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_in", {
    p_ticket_code: ticketCode.trim().toUpperCase(),
    p_reason: reason || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/checkin");
  revalidatePath("/admin/attendance");
  return data;
}

