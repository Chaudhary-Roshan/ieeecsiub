"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { EventItem } from "@/types";

export async function saveEventAction(eventData: Partial<EventItem>): Promise<{ success: boolean; error?: string; event?: any }> {
  try {
    const supabase = await createClient();

    const cleanSlug = eventData.slug ? String(eventData.slug).replace(/^\/+/, "").replace(/\/+$/, "").replace(/\s+/g, "-").toLowerCase() : `event-${Date.now()}`;
    const objectivesRaw = eventData.learningObjectives as any;
    const objectivesText = Array.isArray(objectivesRaw)
      ? objectivesRaw.filter(Boolean).map((s: any) => String(s || "").trim()).join("\n")
      : (typeof objectivesRaw === "string" ? objectivesRaw.trim() : "");

    const galleryRaw = eventData.galleryImages as any;
    const galleryList = Array.isArray(galleryRaw)
      ? galleryRaw.filter(Boolean).map((s: any) => String(s || "").trim())
      : (typeof galleryRaw === "string" ? [galleryRaw.trim()].filter(Boolean) : []);

    const payload = {
      id: eventData.id || undefined,
      slug: cleanSlug,
      title: (eventData.title || "Untitled Event").trim(),
      description: (eventData.description || "").trim(),
      learning_objectives: objectivesText,
      target_audience: (eventData.targetAudience || "").trim(),
      start_date: eventData.startDate || new Date().toISOString(),
      end_date: eventData.endDate || new Date(Date.now() + 86400000).toISOString(),
      venue: (eventData.venue || "TBD").trim(),
      is_online: Boolean(eventData.isOnline),
      meeting_link: (eventData.meetingLink || "").trim() || null,
      status: ((eventData.status || "UPCOMING") as string).trim().toUpperCase(),
      status_reason: (eventData.statusReason || "").trim() || null,
      seats_limit: Number(eventData.seatsLimit) || 60,
      registered_count: Number(eventData.registeredCount) || 0,
      registration_deadline: eventData.registrationDeadline || null,
      fee_pkr: Number(eventData.feePkr) || 0,
      payment_instructions: (eventData.paymentInstructions || "").trim() || null,
      certificate_type: (eventData.certificateType || "Certificate of Participation").trim(),
      certificate_rule: (eventData.certificateRule || "Attend full session").trim(),
      vtools_id: (eventData.vtoolsId || "").trim() || null,
      vtools_link: (eventData.vtoolsLink || "").trim() || null,
      featured_image: (eventData.featuredImage || "/ieee-cs-logo.png").trim(),
      gallery_images: galleryList,
      event_report: (eventData.eventReport || "").trim() || null,
      speakers: Array.isArray(eventData.speakers) ? eventData.speakers : [],
      is_published: true,
    };

    // 1. Try dedicated PostgreSQL SECURITY DEFINER RPC
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("save_event", {
      event_data: payload,
    });

    if (!rpcErr && rpcRes && rpcRes.success) {
      try {
        revalidatePath("/");
        revalidatePath("/events");
        revalidatePath(`/events/${cleanSlug}`);
        const baseSlug = cleanSlug.split("/").pop();
        if (baseSlug) revalidatePath(`/events/${baseSlug}`);
      } catch (revErr) {
        console.warn("Revalidation warning:", revErr);
      }
      return { success: true, event: rpcRes.event };
    }

    if (rpcErr) {
      console.error("saveEventAction RPC error:", rpcErr);
      return { success: false, error: rpcErr.message || "Database RPC rejected save_event." };
    }

    return { success: false, error: "Failed to save event to database." };
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
      try {
        revalidateTag("events");
        revalidatePath("/");
        revalidatePath("/events");
      } catch (revErr) {
        console.warn("Revalidation warning:", revErr);
      }
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

    try {
      revalidateTag("events");
      revalidatePath("/");
      revalidatePath("/events");
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteEventAction unexpected error:", err);
    return { success: false, error: err?.message || "An unexpected error occurred while deleting event." };
  }
}
