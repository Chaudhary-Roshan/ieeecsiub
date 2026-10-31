"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { EventItem } from "@/types";

export async function saveEventAction(eventData: Partial<EventItem>) {
  const supabase = await createClient();

  const slug = eventData.slug ? eventData.slug.replace(/^\/+/, "") : `event-${Date.now()}`;
  const payload = {
    slug,
    title: eventData.title || "Untitled Event",
    description: eventData.description || "",
    learning_objectives: eventData.learningObjectives || [],
    target_audience: eventData.targetAudience || "",
    start_date: eventData.startDate || new Date().toISOString(),
    end_date: eventData.endDate || new Date().toISOString(),
    venue: eventData.venue || "TBD",
    is_online: Boolean(eventData.isOnline),
    meeting_link: eventData.meetingLink || null,
    status: (eventData.status || "UPCOMING").toUpperCase(),
    status_reason: eventData.statusReason || null,
    seats_limit: eventData.seatsLimit || null,
    registered_count: eventData.registeredCount || 0,
    registration_deadline: eventData.registrationDeadline || null,
    fee_pkr: eventData.feePkr ?? 0,
    payment_instructions: eventData.paymentInstructions || null,
    certificate_type: eventData.certificateType || "Certificate of Participation",
    certificate_rule: eventData.certificateRule || "Attend full session",
    vtools_id: eventData.vtoolsId || null,
    vtools_link: eventData.vtoolsLink || null,
    featured_image: eventData.featuredImage || "/events/digitalfest-banner.png",
    gallery_images: eventData.galleryImages || [],
    event_report: eventData.eventReport || null,
    speakers: eventData.speakers || [],
    is_published: true,
    updated_at: new Date().toISOString(),
  };

  let res;
  if (eventData.id) {
    res = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventData.id)
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
    console.error("saveEventAction database error:", res.error);
    throw new Error(`Failed to save event to database: ${res.error.message}`);
  }

  // Instant server-side revalidation across all public pages
  try {
    revalidateTag("events");
  } catch {}
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
  revalidatePath("/admin/events");

  return { success: true, event: res.data };
}

export async function deleteEventAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }

  try {
    revalidateTag("events");
  } catch {}
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin/events");

  return { success: true };
}
