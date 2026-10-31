import { createClient } from "@/lib/supabase/server";
import { TeamMember } from "@/types";

export async function getTeamMembers(options?: { currentOnly?: boolean }): Promise<TeamMember[]> {
  const supabase = await createClient();

  let query = supabase
    .from("team_members")
    .select("*")
    .order("order_index", { ascending: true });

  if (options?.currentOnly) {
    query = query.eq("is_current", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch team members from Supabase:", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    position: row.position,
    committeeYear: row.committee_year,
    photoUrl: row.photo_url || "/team/placeholder.png",
    approvedBio: row.approved_bio || "",
    isCurrent: Boolean(row.is_current),
    email: row.email || "",
    linkedinUrl: row.linkedin_url || "",
    orderIndex: row.order_index ?? 0,
  }));
}

