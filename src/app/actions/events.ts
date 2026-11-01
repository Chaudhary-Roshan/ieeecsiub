"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { EventItem } from "@/types";

export async function saveEventAction(eventData: Partial<EventItem>): Promise<{ success: boolean; error?: string; event?: any }> {
  try {
    const supabase = await createClient();

    const slug = eventData.slug ? eventData.slug.replace(/^\/+/, "") : `event-${Date.now()}`;
    const objectivesText = Array.isArray(eventData.learningObjectives)
      ? eventData.learningObjectives.join("\n")
      : (eventData.learningObjectives || "");

    const payload = {
      id: eventData.id || undefined,
      slug,
      title: eventData.title || "Untitled Event",
      description: eventData.description || "",
      learning_objectives: objectivesText,
      target_audience: eventData.targetAudience || "",
      start_date: eventData.startDate || new Date().toISOString(),
      end_date: eventData.endDate || new Date(Date.now() + 86400000).toISOString(),
      venue: eventData.venue || "TBD",
      is_online: Boolean(eventData.isOnline),
      meeting_link: eventData.meetingLink || null,
      status: (eventData.status || "UPCOMING").toUpperCase(),
      status_reason: eventData.statusReason || null,
      seats_limit: eventData.seatsLimit || 60,
      registered_count: eventData.registeredCount || 0,
      registration_deadline: eventData.registrationDeadline || null,
      fee_pkr: eventData.feePkr ?? 0,
      payment_instructions: eventData.paymentInstructions || null,
      certificate_type: eventData.certificateType || "Certificate of Participation",
      certificate_rule: eventData.certificateRule || "Attend full session",
      vtools_id: eventData.vtoolsId || null,
      vtools_link: eventData.vtoolsLink || null,
      featured_image: eventData.featuredImage || "/ieee-cs-logo.png",
      gallery_images: eventData.galleryImages || [],
      event_report: eventData.eventReport || null,
      speakers: eventData.speakers || [],
      is_published: true,
    };

    // 1. Try dedicated PostgreSQL SECURITY DEFINER RPC
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("save_event", {
      event_data: payload,
    });

    if (!rpcErr && rpcRes && rpcRes.success) {
      try { revalidateTag("events"); } catch {}
      revalidatePath("/");
      revalidatePath("/events");
      revalidatePath(`/events/${slug}`);
      revalidatePath("/admin/events");
      return { success: true, event: rpcRes.event };
    }

    // 2. Direct table fallback if RPC is not yet present
    let res;
    if (payload.id) {
      res = await supabase
        .from("events")
        .update(payload)
        .eq("id", payload.id)
        .select()
        .single();
    } else {
      res = await supabase
        .from("events")
        .insert(payload)
        .select()
        .single();
    }

    if (res.error) {
      console.error("saveEventAction database error:", res.error, rpcErr);
      return { success: false, error: res.error.message || rpcErr?.message || "Failed to save event." };
    }

    try { revalidateTag("events"); } catch {}
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);
    revalidatePath("/admin/events");

    return { success: true, event: res.data };
  } catch (err: any) {
    console.error("saveEventAction unexpected error:", err);
    return { success: false, error: err?.message || "An unexpected error occurred while saving event." };
  }
}

export async function deleteEventAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Try dedicated RPC
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("delete_event", {
      p_event_id: id,
    });

    if (!rpcErr && rpcRes && rpcRes.success) {
      try { revalidateTag("events"); } catch {}
      revalidatePath("/");
      revalidatePath("/events");
      revalidatePath("/admin/events");
      return { success: true };
    }

    // 2. Direct table fallback
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    try { revalidateTag("events"); } catch {}
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/admin/events");

    return { success: true };
  } catch (err: any) {
    console.error("deleteEventAction unexpected error:", err);
    return { success: false, error: err?.message || "An unexpected error occurred while deleting event." };
  }
}
