"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { TeamMember } from "@/types";

export async function saveTeamMemberAction(memberData: Partial<TeamMember>) {
  const supabase = await createClient();

  const payload = {
    name: memberData.name || "Member",
    position: memberData.position || "Executive Member",
    committee_year: memberData.committeeYear || "2026-2027",
    photo_url: memberData.photoUrl || "/team/placeholder.png",
    approved_bio: memberData.approvedBio || "",
    is_current: memberData.isCurrent !== undefined ? Boolean(memberData.isCurrent) : true,
    email: memberData.email || null,
    linkedin_url: memberData.linkedinUrl || null,
    order_index: memberData.orderIndex ?? 10,
    updated_at: new Date().toISOString(),
  };

  let res;
  if (memberData.id) {
    res = await supabase
      .from("team_members")
      .update(payload)
      .eq("id", memberData.id)
      .select()
      .single();
  } else {
    res = await supabase
      .from("team_members")
      .insert(payload)
      .select()
      .single();
  }

  if (res.error) {
    console.error("saveTeamMemberAction database error:", res.error);
    throw new Error(`Failed to save officer to database: ${res.error.message}`);
  }

  try {
    revalidateTag("team");
  } catch {}
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin/team");

  return { success: true, member: res.data };
}

export async function deleteTeamMemberAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete officer: ${error.message}`);
  }

  try {
    revalidateTag("team");
  } catch {}
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin/team");

  return { success: true };
}

