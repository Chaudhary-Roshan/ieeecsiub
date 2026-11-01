"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { TeamMember } from "@/types";

export async function saveTeamMemberAction(memberData: Partial<TeamMember>): Promise<{ success: boolean; error?: string; member?: any }> {
  try {
    const supabase = await createClient();

    const payload = {
      id: memberData.id || undefined,
      name: memberData.name || "Member",
      position: memberData.position || "Executive Member",
      committee_year: memberData.committeeYear || "2026-2027",
      photo_url: memberData.photoUrl || "/team/placeholder.png",
      approved_bio: memberData.approvedBio || "",
      is_current: memberData.isCurrent !== undefined ? Boolean(memberData.isCurrent) : true,
      email: memberData.email || null,
      linkedin_url: memberData.linkedinUrl || null,
      order_index: memberData.orderIndex ?? 10,
    };

    // 1. Try dedicated RPC
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("save_team_member", {
      member_data: payload,
    });

    if (!rpcErr && rpcRes && rpcRes.success) {
      try {
        revalidateTag("team");
        revalidatePath("/");
        revalidatePath("/team");
      } catch (revErr) {
        console.warn("Revalidation warning:", revErr);
      }
      return { success: true, member: rpcRes.member };
    }

    // 2. Direct table fallback
    let res;
    if (payload.id) {
      res = await supabase
        .from("team_members")
        .update(payload)
        .eq("id", payload.id)
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
      return { success: false, error: res.error.message || rpcErr?.message || "Failed to save officer." };
    }

    try {
      revalidateTag("team");
      revalidatePath("/");
      revalidatePath("/team");
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return { success: true, member: res.data };
  } catch (err: any) {
    console.error("saveTeamMemberAction unexpected error:", err);
    return { success: false, error: err?.message || "An unexpected error occurred while saving officer." };
  }
}

export async function deleteTeamMemberAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Try dedicated RPC
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("delete_team_member", {
      p_member_id: id,
    });

    if (!rpcErr && rpcRes && rpcRes.success) {
      try {
        revalidateTag("team");
        revalidatePath("/");
        revalidatePath("/team");
      } catch (revErr) {
        console.warn("Revalidation warning:", revErr);
      }
      return { success: true };
    }

    // 2. Direct table fallback
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    try {
      revalidateTag("team");
      revalidatePath("/");
      revalidatePath("/team");
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteTeamMemberAction unexpected error:", err);
    return { success: false, error: err?.message || "An unexpected error occurred while deleting officer." };
  }
}
