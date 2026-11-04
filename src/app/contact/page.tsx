import React from "react";
import { ContactClient } from "@/components/contact/ContactClient";
import { DEFAULT_CHAPTER_SETTINGS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { ChapterSettings } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Contact Us | IEEE Computer Society UCET-IUB",
  description: "Connect with the executive committee, faculty advisors, and secretariat of IEEE CS UCET-IUB.",
};

export default async function ContactPage() {
  const supabase = await createClient();
  let settings: ChapterSettings = DEFAULT_CHAPTER_SETTINGS;

  try {
    const { data, error } = await supabase
      .from("chapter_settings")
      .select("*")
      .eq("id", "current")
      .maybeSingle();

    if (!error && data) {
      settings = {
        id: data.id,
        emailGeneral: data.email_general || DEFAULT_CHAPTER_SETTINGS.emailGeneral,
        emailVerify: data.email_verify || DEFAULT_CHAPTER_SETTINGS.emailVerify,
        whatsappGroupUrl: data.whatsapp_group_url || DEFAULT_CHAPTER_SETTINGS.whatsappGroupUrl,
        whatsappChatNumber: data.whatsapp_chat_number || DEFAULT_CHAPTER_SETTINGS.whatsappChatNumber,
        linkedinUrl: data.linkedin_url || DEFAULT_CHAPTER_SETTINGS.linkedinUrl,
        instagramUrl: data.instagram_url || DEFAULT_CHAPTER_SETTINGS.instagramUrl,
        facebookUrl: data.facebook_url || DEFAULT_CHAPTER_SETTINGS.facebookUrl,
        githubUrl: data.github_url || DEFAULT_CHAPTER_SETTINGS.githubUrl,
        parentBranchUrl: data.parent_branch_url || DEFAULT_CHAPTER_SETTINGS.parentBranchUrl,
        sectionUrl: data.section_url || DEFAULT_CHAPTER_SETTINGS.sectionUrl,
        addressRoom1: data.address_room_1 || DEFAULT_CHAPTER_SETTINGS.addressRoom1,
        addressRoom2: data.address_room_2 || DEFAULT_CHAPTER_SETTINGS.addressRoom2,
        updatedAt: data.updated_at,
        updatedBy: data.updated_by,
      };
    }
  } catch (err) {
    console.warn("Contact settings fetch warning:", err);
  }

  return (
    <div className="flex-1 bg-gray-50 py-10 md:py-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-ieee-blue text-xs font-montserrat font-bold uppercase tracking-wider">
            Official Communications Desk
          </div>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy tracking-tight">
            Contact IEEE CS UCET-IUB
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have questions regarding upcoming technical workshops, partnership inquiries, membership enrollment, or certificate authentications? Connect with our executive desk through your preferred channel.
          </p>
        </div>

        {/* Dynamic Live Contact Client */}
        <ContactClient initialSettings={settings} />
      </div>
    </div>
  );
}
