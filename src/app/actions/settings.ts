"use server";

import { revalidatePath } from "next/cache";
import { ChapterSettings } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CHAPTER_SETTINGS } from "@/lib/constants";

export async function saveChapterSettingsAction(
  settings: ChapterSettings,
  staffName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const clean: ChapterSettings = {
      ...DEFAULT_CHAPTER_SETTINGS,
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: staffName || "Chapter Administrator",
    };

    const payload = {
      id: "current",
      email_general: clean.emailGeneral.trim(),
      email_verify: clean.emailVerify.trim(),
      whatsapp_group_url: clean.whatsappGroupUrl.trim(),
      whatsapp_chat_number: clean.whatsappChatNumber.trim(),
      linkedin_url: clean.linkedinUrl.trim(),
      instagram_url: clean.instagramUrl.trim(),
      facebook_url: clean.facebookUrl.trim(),
      github_url: clean.githubUrl.trim(),
      parent_branch_url: clean.parentBranchUrl.trim(),
      section_url: clean.sectionUrl.trim(),
      address_room_1: clean.addressRoom1.trim(),
      address_room_2: clean.addressRoom2.trim(),
      updated_at: clean.updatedAt,
      updated_by: clean.updatedBy,
    };

    const { error } = await supabase
      .from("chapter_settings")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("saveChapterSettingsAction supabase error:", error.message);
      // Even if remote table does not exist yet, we still return false so caller knows
      return { success: false, error: error.message };
    }

    try {
      revalidatePath("/");
      revalidatePath("/contact");
      revalidatePath("/admin/settings");
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error("saveChapterSettingsAction exception:", err);
    return { success: false, error: err?.message || "Failed to save settings." };
  }
}

