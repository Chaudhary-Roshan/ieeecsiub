"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { ChapterSettings, StaffUser } from "@/types";
import { DEFAULT_CHAPTER_SETTINGS } from "@/lib/constants";
import { saveChapterSettingsAction } from "@/app/actions/settings";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Share2,
  MapPin,
  ExternalLink,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ChapterSettings>(DEFAULT_CHAPTER_SETTINGS);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      const data = await db.fetchChapterSettings();
      setSettings(data);
    }
    load();

    const savedStaff = localStorage.getItem("ieee_cs_active_staff");
    if (savedStaff) {
      try {
        setCurrentUser(JSON.parse(savedStaff));
      } catch {}
    }
  }, []);

  const handleChange = (field: keyof ChapterSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      // 1. Save in client db layer (local cache + client Supabase)
      await db.saveChapterSettings(settings, currentUser?.name);

      // 2. Trigger Server Action to revalidate paths
      await saveChapterSettingsAction(settings, currentUser?.name);

      setFeedback({
        type: "success",
        message: "Chapter profile and contact channels updated live across the entire website!",
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: `Failed to save changes: ${err?.message || "Unknown error"}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all contact, social, and address fields to chapter defaults?")) {
      setSettings(DEFAULT_CHAPTER_SETTINGS);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ieee-blue/20 focus:border-ieee-blue transition-all";

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-ieee-navy/10 text-ieee-navy px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                Platform Configuration
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-xs text-status-active font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Live Sync
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
              Chapter Profile & Social Hub
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Centrally manage official Gmail addresses, WhatsApp community invite links, social channels, and campus headquarters addresses.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/contact" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1.5">
                <ExternalLink size={14} /> View Public /contact
              </Button>
            </Link>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="primary"
              size="sm"
              className="text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Status Feedback Toast */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-red-50 text-red-900 border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            )}
            <div className="flex-1 text-xs sm:text-sm">{feedback.message}</div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Official Communications (Gmail) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-base font-montserrat font-bold text-gray-900">
                  Official Chapter Email Addresses
                </h2>
                <p className="text-xs text-gray-500">
                  Used on public contact cards, automated reply signatures, and verification desks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  General Inquiries & Chapter Gmail
                </label>
                <input
                  type="email"
                  value={settings.emailGeneral}
                  onChange={(e) => handleChange("emailGeneral", e.target.value)}
                  placeholder="ieeecsiub.contact@gmail.com"
                  required
                  className={inputClass}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Primary public communication address displayed on the Contact page & footer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Credentials & Verification Desk Email
                </label>
                <input
                  type="email"
                  value={settings.emailVerify}
                  onChange={(e) => handleChange("emailVerify", e.target.value)}
                  placeholder="ieeecsiub.contact@gmail.com"
                  required
                  className={inputClass}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Direct contact provided to employers and institutions on certificate verification pages.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: WhatsApp Hub & Direct Support */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                <MessageCircle size={20} />
              </div>
              <div>
                <h2 className="text-base font-montserrat font-bold text-gray-900">
                  WhatsApp Community & Direct Support
                </h2>
                <p className="text-xs text-gray-500">
                  Configure student group join link and direct officer WhatsApp messaging number.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Official WhatsApp Community / Group Invite URL
                </label>
                <input
                  type="url"
                  value={settings.whatsappGroupUrl}
                  onChange={(e) => handleChange("whatsappGroupUrl", e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  required
                  className={inputClass}
                />
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Powers the &quot;Join Community&quot; button.</span>
                  {settings.whatsappGroupUrl && (
                    <a
                      href={settings.whatsappGroupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Test Link <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  WhatsApp Quick Chat Phone Number (without + or spaces)
                </label>
                <input
                  type="text"
                  value={settings.whatsappChatNumber}
                  onChange={(e) => handleChange("whatsappChatNumber", e.target.value)}
                  placeholder="923000000000"
                  required
                  className={inputClass}
                />
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">e.g. 923000000000 (Powers direct wa.me chat)</span>
                  {settings.whatsappChatNumber && (
                    <a
                      href={`https://wa.me/${settings.whatsappChatNumber.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Test Chat <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Verified Social Networks */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-ieee-blue flex items-center justify-center shadow-sm">
                <Share2 size={20} />
              </div>
              <div>
                <h2 className="text-base font-montserrat font-bold text-gray-900">
                  Verified Social & Academic Networks
                </h2>
                <p className="text-xs text-gray-500">
                  Displayed on the Contact Social Card and globally in the website footer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  LinkedIn Company Page
                </label>
                <input
                  type="url"
                  value={settings.linkedinUrl}
                  onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                  placeholder="https://www.linkedin.com/company/..."
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Instagram Profile
                </label>
                <input
                  type="url"
                  value={settings.instagramUrl}
                  onChange={(e) => handleChange("instagramUrl", e.target.value)}
                  placeholder="https://www.instagram.com/..."
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Facebook Page
                </label>
                <input
                  type="url"
                  value={settings.facebookUrl}
                  onChange={(e) => handleChange("facebookUrl", e.target.value)}
                  placeholder="https://www.facebook.com/..."
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  GitHub Organization
                </label>
                <input
                  type="url"
                  value={settings.githubUrl}
                  onChange={(e) => handleChange("githubUrl", e.target.value)}
                  placeholder="https://github.com/..."
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Parent Student Branch Portal
                </label>
                <input
                  type="url"
                  value={settings.parentBranchUrl}
                  onChange={(e) => handleChange("parentBranchUrl", e.target.value)}
                  placeholder="https://edu.ieee.org/pk-ucetiub"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  IEEE Bahawalpur Section Website
                </label>
                <input
                  type="url"
                  value={settings.sectionUrl}
                  onChange={(e) => handleChange("sectionUrl", e.target.value)}
                  placeholder="https://ieeebahawalpurssection.org/"
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Campus Headquarters Addresses */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-sm">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-base font-montserrat font-bold text-gray-900">
                  Campus Headquarters & Physical Addresses
                </h2>
                <p className="text-xs text-gray-500">
                  Displayed on the Contact page address cards and in the global footer.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Campus Address 1 (Department & Old Engineering Building)
                </label>
                <input
                  type="text"
                  value={settings.addressRoom1}
                  onChange={(e) => handleChange("addressRoom1", e.target.value)}
                  placeholder="Room No. 1.25, Department of Information and Communication Engineering, Old Engineering Building, UCET"
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ieee-blue/20 focus:border-ieee-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Campus Address 2 (Faculty of Engineering, Baghdad-ul-Jadeed Campus)
                </label>
                <input
                  type="text"
                  value={settings.addressRoom2}
                  onChange={(e) => handleChange("addressRoom2", e.target.value)}
                  placeholder="Room No. 105, Faculty of Engineering, IUB, Baghdad-ul-Jadeed Campus, Bahawalpur, Pakistan."
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ieee-blue/20 focus:border-ieee-blue transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <Info size={14} className="text-ieee-blue" />
              All changes take effect immediately across public contact cards, WhatsApp join buttons, and global footers.
            </div>
            <Button
              type="submit"
              disabled={isSaving}
              variant="primary"
              size="md"
              className="font-bold flex items-center gap-2 shadow-sm"
            >
              <Save size={16} /> {isSaving ? "Saving Live Changes..." : "Save Platform Profile"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
