import { createClient } from "@/lib/supabase/server";
import { EventItem, EventTeam } from "@/types";

export async function getEvents(options?: { publishedOnly?: boolean }): Promise<EventItem[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  if (options?.publishedOnly) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch events from Supabase:", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    learningObjectives: row.learning_objectives || [],
    targetAudience: row.target_audience || "",
    startDate: row.start_date,
    endDate: row.end_date,
    venue: row.venue,
    isOnline: Boolean(row.is_online),
    meetingLink: row.meeting_link || "",
    status: row.status,
    statusReason: row.status_reason || "",
    seatsLimit: row.seats_limit ?? undefined,
    registeredCount: row.registered_count ?? 0,
    registrationDeadline: row.registration_deadline || undefined,
    feePkr: row.fee_pkr ?? 0,
    paymentInstructions: row.payment_instructions || "",
    certificateType: row.certificate_type || "",
    certificateRule: row.certificate_rule || "",
    vtoolsId: row.vtools_id || "",
    vtoolsLink: row.vtools_link || "",
    featuredImage: row.featured_image || "/events/digitalfest-banner.png",
    galleryImages: row.gallery_images || [],
    eventReport: row.event_report || "",
    speakers: row.speakers || [],
  }));
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  const supabase = await createClient();
  
  const cleanSlug = slug.replace(/^\/+/, "");
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .or(`slug.eq.${cleanSlug},slug.eq./${cleanSlug}`)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    learningObjectives: data.learning_objectives || [],
    targetAudience: data.target_audience || "",
    startDate: data.start_date,
    endDate: data.end_date,
    venue: data.venue,
    isOnline: Boolean(data.is_online),
    meetingLink: data.meeting_link || "",
    status: data.status,
    statusReason: data.status_reason || "",
    seatsLimit: data.seats_limit ?? undefined,
    registeredCount: data.registered_count ?? 0,
    registrationDeadline: data.registration_deadline || undefined,
    feePkr: data.fee_pkr ?? 0,
    paymentInstructions: data.payment_instructions || "",
    certificateType: data.certificate_type || "",
    certificateRule: data.certificate_rule || "",
    vtoolsId: data.vtools_id || "",
    vtoolsLink: data.vtools_link || "",
    featuredImage: data.featured_image || "/events/digitalfest-banner.png",
    galleryImages: data.gallery_images || [],
    eventReport: data.event_report || "",
    speakers: data.speakers || [],
  };
}

export async function getEventTeams(eventId: string): Promise<EventTeam[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_teams")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((t, index) => {
    const rawMembers = Array.isArray(t.members) ? t.members : (typeof t.members === "string" ? t.members.split(";").map((s: string) => s.trim()).filter(Boolean) : []);
    return {
      id: t.id,
      eventId: t.event_id,
      sr: t.sr ?? (index + 1),
      teamName: t.team_name,
      projectTitle: t.project_title || "",
      teamLeader: t.team_leader,
      semester: t.semester || "General",
      memberCount: t.member_count ?? rawMembers.length,
      teamMembers: rawMembers,
      projectDomain: t.project_domain || undefined,
      positionAward: t.placement || t.position_award || undefined,
      demoUrl: t.demo_url || undefined,
      createdAt: t.created_at || undefined,
    };
  });
}
