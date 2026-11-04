"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CHAPTER_INFO } from "@/lib/constants";
import { ChapterSettings } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  MapPin,
  ShieldCheck,
  Send,
  MessageSquare,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.769.814 2.801.815 3.179 0 5.766-2.587 5.768-5.766 0-3.18-2.587-5.768-5.773-5.773-5.768zm3.364 8.163c-.143.402-.711.737-1.155.834-.306.067-.704.122-2.049-.434-1.722-.712-2.834-2.459-2.92-2.572-.086-.114-.697-.927-.697-1.768 0-.841.442-1.255.6-.1426.157-.171.343-.214.457-.214.114 0 .228.001.328.006.105.005.245-.04.383.292.143.344.486 1.187.529 1.273.043.086.071.186.014.3-.057.114-.086.186-.171.286-.086.1-.181.223-.258.3-.086.086-.176.18-.076.352.1.171.444.733.953 1.186.656.584 1.209.765 1.38.851.171.086.271.071.371-.043.1-.114.428-.499.542-.671.114-.171.229-.143.386-.086.157.057 1.001.472 1.172.558.171.086.286.129.329.2.043.072.043.415-.1.817z" />
      <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.462 3.488 1.338 5.008l-1.346 4.996 5.129-1.345c1.472.805 3.131 1.237 4.875 1.237 5.518 0 9.996-4.478 9.996-9.996 0-5.518-4.478-9.996-9.996-9.996zm0 18.232c-1.547 0-3.06-.415-4.385-1.2l-.315-.187-3.045.799.812-2.969-.205-.327c-.859-1.368-1.313-2.956-1.313-4.593 0-4.664 3.794-8.458 8.458-8.458 4.664 0 8.458 3.794 8.458 8.458 0 4.664-3.794 8.458-8.458 8.458z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.456 5 15.584 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z" />
    </svg>
  );
}

function GitHubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

interface ContactClientProps {
  initialSettings: ChapterSettings;
}

export const ContactClient: React.FC<ContactClientProps> = ({ initialSettings }) => {
  const [settings] = useState<ChapterSettings>(initialSettings);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(settings.emailGeneral || "ieeecsiub.contact@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaAnswer.trim() !== "8") {
      alert("Please solve the security challenge (5 + 3 = ?)");
      return;
    }
    if (supabase) {
      supabase.from("contact_messages").insert({ name, email, subject, message });
    }
    setSubmitted(true);
  };

  return (
    <div className="space-y-10">
      {/* 3 Prominent Featured Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Gmail Official Card */}
        <div className="bg-white border-2 border-red-100 hover:border-red-300 rounded-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none group-hover:bg-red-500/10 transition-colors" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-xs">
                <Mail size={24} />
              </div>
              <span className="text-[10px] font-montserrat font-bold uppercase px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                Primary Inbox
              </span>
            </div>

            <div>
              <h2 className="font-montserrat font-extrabold text-lg text-ieee-navy">
                Official Chapter Inbox
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Monitored daily by Executive Officers for inquiries, sponsorships &amp; credential cross-checks.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <div className="text-[11px] text-gray-500 font-medium">Click to email directly:</div>
              <a
                href={`mailto:${settings.emailGeneral}`}
                className="font-mono text-xs font-bold text-red-600 hover:text-red-700 break-all block underline decoration-red-200"
              >
                {settings.emailGeneral}
              </a>
              <div className="text-[10px] text-gray-400">
                Verify queries: <strong className="text-gray-700">{settings.emailVerify}</strong>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center gap-2">
            <a
              href={`mailto:${settings.emailGeneral}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-montserrat font-bold text-xs transition-colors shadow-2xs"
            >
              Compose Mail <ArrowRight size={13} />
            </a>
            <button
              onClick={handleCopyEmail}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
              title="Copy Email Address"
            >
              {copiedEmail ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* 2. WhatsApp Official Gateway */}
        <div className="bg-white border-2 border-emerald-100 hover:border-emerald-300 rounded-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                <WhatsAppIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-montserrat font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Instant Chat
              </span>
            </div>

            <div>
              <h2 className="font-montserrat font-extrabold text-lg text-ieee-navy">
                WhatsApp Community Desk
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Direct student chat for quick workshop announcements, venue directions, and registration assistance.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
              <div className="text-[11px] text-gray-500 font-medium">Official Desk Number:</div>
              <div className="font-mono text-xs font-bold text-emerald-700">
                {settings.whatsappChatNumber || "+92 328 1780820"}
              </div>
              <div className="text-[10px] text-gray-400">
                WhatsApp Announcement Community link available below
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2">
            <a
              href={`https://wa.me/${(settings.whatsappChatNumber || "923281780820").replace(/[^0-9]/g, "")}?text=Hello%20IEEE%20CS%20UCET%20IUB`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-montserrat font-bold text-xs transition-colors shadow-2xs"
            >
              <WhatsAppIcon className="w-4 h-4" /> Message Desk
            </a>
            {settings.whatsappGroupUrl && (
              <a
                href={settings.whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
              >
                Join Community <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* 3. Official Social Channels */}
        <div className="bg-white border-2 border-blue-100 hover:border-blue-300 rounded-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-ieee-blue flex items-center justify-center border border-blue-100 shadow-xs">
                <Share2 size={24} />
              </div>
              <span className="text-[10px] font-montserrat font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Social Media
              </span>
            </div>

            <div>
              <h2 className="font-montserrat font-extrabold text-lg text-ieee-navy">
                Social &amp; Developer Hubs
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Follow live stories, announcements, speaker cards, code repositories, and regional Section updates.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href={settings.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-blue-50 hover:border-blue-200 flex items-center gap-2 text-gray-700 hover:text-blue-700 transition-colors"
              >
                <LinkedInIcon className="w-4 h-4 text-[#0077B5]" />
                <span className="font-medium text-[11px]">LinkedIn</span>
              </a>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-pink-50 hover:border-pink-200 flex items-center gap-2 text-gray-700 hover:text-pink-700 transition-colors"
              >
                <InstagramIcon className="w-4 h-4 text-[#E4405F]" />
                <span className="font-medium text-[11px]">Instagram</span>
              </a>

              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-blue-50 hover:border-blue-200 flex items-center gap-2 text-gray-700 hover:text-blue-800 transition-colors"
              >
                <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                <span className="font-medium text-[11px]">Facebook</span>
              </a>

              <a
                href={settings.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-gray-100 flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
              >
                <GitHubIcon className="w-4 h-4 text-[#24292e]" />
                <span className="font-medium text-[11px]">GitHub</span>
              </a>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Parent Branch:</span>
            <a
              href={settings.parentBranchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ieee-blue font-semibold hover:underline inline-flex items-center gap-1"
            >
              edu.ieee.org <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Campus Location & Web Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Column: Campus Physical Secretariat (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ieee-border rounded-card p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-[11px] font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
                Physical Office &amp; Labs
              </span>
              <h2 className="text-xl font-montserrat font-extrabold text-ieee-navy">
                On-Campus Secretariat
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Meet our student leadership in person at the engineering building on weekdays.
              </p>
            </div>

            <div className="space-y-4 text-xs text-gray-700 border-t border-gray-100 pt-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-ieee-blue flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <strong className="text-gray-900 block font-montserrat">Department Secretariat</strong>
                  <p className="text-gray-600 mt-0.5 leading-relaxed">
                    {settings.addressRoom1 || "Department of Computer Science & IT / UCET"}<br />
                    University College of Engineering &amp; Technology (UCET)<br />
                    The Islamia University of Bahawalpur (Baghdad-ul-Jadeed Campus)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-ieee-orange flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <strong className="text-gray-900 block font-montserrat">Desk Timings</strong>
                  <p className="text-gray-600 mt-0.5">
                    Monday &ndash; Friday: 09:00 AM &ndash; 04:00 PM (PKT)<br />
                    <span className="text-gray-400">Closed on Gazetted Holidays &amp; University Recess</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="text-status-active flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <strong className="text-gray-900 block font-montserrat">Certificate Verification Queries</strong>
                  <p className="text-gray-600 mt-0.5">
                    Need instant credential validation? Use our automated portal at{" "}
                    <Link href="/verify" className="text-ieee-blue underline font-semibold">
                      ieeecsiub.vercel.app/verify
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Dispatch Form (3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-ieee-border rounded-card p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <span className="text-[11px] font-montserrat font-bold text-ieee-blue uppercase tracking-wider block">
                Direct Dispatch
              </span>
              <h2 className="text-xl font-montserrat font-extrabold text-ieee-navy">
                Send a Message to Executive Committee
              </h2>
              <p className="text-xs text-gray-600">
                Submit your inquiry below; our general secretary will route it to the appropriate officer within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-sm font-montserrat font-bold text-emerald-900">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Inquiry Dispatched Successfully!
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Thank you for reaching out to IEEE Computer Society UCET-IUB. A copy has been delivered to the chapter secretariat desk. You may also join our WhatsApp group for faster response.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-montserrat font-bold text-emerald-800 underline hover:text-emerald-950"
                  >
                    Send another query
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-openSans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Asadullah Yousaf"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ieee-blue focus:border-ieee-blue outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@ucet.edu.pk"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ieee-blue focus:border-ieee-blue outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Subject / Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Workshop Registration Query / Certificate Verification"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ieee-blue focus:border-ieee-blue outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Your Message / Question <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide detailed information regarding your inquiry..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ieee-blue focus:border-ieee-blue outline-none text-xs resize-none"
                  />
                </div>

                {/* Math Security Challenge */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                    <HelpCircle size={15} className="text-ieee-blue" />
                    <span>Human Security Check: What is <strong>5 + 3</strong>?</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Answer"
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center font-bold text-xs"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
                    <Send size={14} className="mr-2" /> Dispatch Message to Secretariat
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
