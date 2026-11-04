"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DEFAULT_CHAPTER_SETTINGS, CHAPTER_INFO } from "@/lib/constants";
import { ChapterSettings } from "@/types";
import { db } from "@/lib/db";
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

// Official Brand SVGs for Maximum Crispness
function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.769.814 2.801.815 3.179 0 5.766-2.587 5.768-5.766 0-3.18-2.587-5.768-5.773-5.768zm3.364 8.163c-.143.402-.711.737-1.155.834-.306.067-.704.122-2.049-.434-1.722-.712-2.834-2.459-2.92-2.572-.086-.114-.697-.927-.697-1.768 0-.841.442-1.255.6-.1426.157-.171.343-.214.457-.214.114 0 .228.001.328.006.105.005.245-.04.383.292.143.344.486 1.187.529 1.273.043.086.071.186.014.3-.057.114-.086.186-.171.286-.086.1-.181.223-.258.3-.086.086-.176.18-.076.352.1.171.444.733.953 1.186.656.584 1.209.765 1.38.851.171.086.271.071.371-.043.1-.114.428-.499.542-.671.114-.171.229-.143.386-.086.157.057 1.001.472 1.172.558.171.086.286.129.329.2.043.072.043.415-.1.817z" />
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

export default function ContactPage() {
  const [settings, setSettings] = useState<ChapterSettings>(DEFAULT_CHAPTER_SETTINGS);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await db.fetchChapterSettings();
      setSettings(data);
    }
    load();
  }, []);

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
    <div className="flex-1 bg-gray-50 py-10 md:py-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-ieee-blue text-xs font-montserrat font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-ieee-orange" />
            Official Communications Desk
          </div>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy tracking-tight">
            Contact IEEE CS UCET-IUB
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have questions regarding upcoming technical workshops, partnership inquiries, membership enrollment, or certificate authentications? Connect with our executive desk through your preferred channel.
          </p>
        </div>

        {/* 3 Prominent Featured Gateway Cards: Gmail Card, WhatsApp Card, Social Links Card */}
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
                <h3 className="font-montserrat font-bold text-lg text-ieee-navy">
                  Official Chapter Gmail
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Direct inquiries, workshop proposals, speaker invitations, and official correspondence.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Direct Address:
                </span>
                <span className="font-mono text-xs font-bold text-ieee-navy break-all select-all">
                  {settings.emailGeneral}
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
              <a
                href={`mailto:${settings.emailGeneral}`}
                className="flex-1 px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail size={14} /> Send Email
              </a>
              <button
                onClick={handleCopyEmail}
                className="px-3 py-2.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                title="Copy Gmail Address to Clipboard"
              >
                {copiedEmail ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copiedEmail ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* 2. WhatsApp Official Community Card */}
          <div className="bg-white border-2 border-emerald-100 hover:border-emerald-300 rounded-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                  <WhatsAppIcon className="w-7 h-7 text-[#25D366]" />
                </div>
                <span className="text-[10px] font-montserrat font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Instant Support
                </span>
              </div>

              <div>
                <h3 className="font-montserrat font-bold text-lg text-ieee-navy">
                  WhatsApp Community
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Join our verified student group for live event announcements, registration support, and quick Q&A.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                  Live Response Desk:
                </span>
                <span className="text-xs text-emerald-900 font-medium">
                  Active chapter officers & student community members available daily.
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
              <a
                href={settings.whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" /> Join Group
              </a>
              <a
                href={`https://wa.me/${settings.whatsappChatNumber.replace(/\D/g, "")}?text=Hello%20IEEE%20CS%20UCET-IUB%20Team,%20I%20have%20an%20inquiry%20regarding:`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 border border-emerald-300 hover:border-emerald-400 bg-white text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                title="Chat directly on WhatsApp"
              >
                <span>Chat</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* 3. Social Media & Networks Card */}
          <div className="bg-white border-2 border-blue-100 hover:border-blue-300 rounded-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-ieee-blue flex items-center justify-center border border-blue-100 shadow-xs">
                  <Share2 size={24} />
                </div>
                <span className="text-[10px] font-montserrat font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Connect & Follow
                </span>
              </div>

              <div>
                <h3 className="font-montserrat font-bold text-lg text-ieee-navy">
                  Social & Developer Links
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Follow our official channels for event photo drops, speaker insights, workshop repos, and technical articles.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
                >
                  <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-[#E1306C]/10 hover:text-[#E1306C] border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-[#E1306C]" />
                  <span>Instagram</span>
                </a>
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-[#1877F2]/10 hover:text-[#1877F2] border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
                >
                  <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                  <span>Facebook</span>
                </a>
                <a
                  href={settings.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-900 hover:text-white border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
                >
                  <GitHubIcon className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
              <a
                href={settings.parentBranchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-ieee-blue hover:underline flex items-center gap-1"
              >
                <span>Parent SB (edu.ieee.org)</span>
                <ExternalLink size={12} />
              </a>
              <span className="text-[11px] text-gray-400 font-medium">5+ Verified Portals</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Additional Desk Cards (Left) and Interactive Message Form (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Location, Verification Desk & Response SLA */}
          <div className="space-y-6">
            {/* Brand Logo Card */}
            <div className="bg-white border border-ieee-border rounded-card p-6 shadow-sm flex items-center justify-center">
              <Image
                src="/ieee-cs-logo.png"
                alt="IEEE Computer Society"
                width={190}
                height={58}
                priority
                className="h-11 w-auto object-contain"
              />
            </div>

            {/* Physical Location */}
            <div className="bg-white border border-ieee-border rounded-card p-6 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-ieee-surfaceTint flex items-center justify-center text-ieee-blue">
                <MapPin size={20} />
              </div>
              <h3 className="font-montserrat font-bold text-base text-ieee-navy">
                Campus Locations
              </h3>
              <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
                <div>
                  <strong className="text-gray-800 block">Location 1:</strong>
                  {settings.addressRoom1}
                </div>
                <div>
                  <strong className="text-gray-800 block">Location 2:</strong>
                  {settings.addressRoom2}
                </div>
              </div>
              <div className="pt-1">
                <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                  <Clock size={12} className="text-ieee-blue" />
                  Monday – Friday: 08:30 AM – 04:00 PM PKT
                </span>
              </div>
            </div>

            {/* Separate Certificate Verification Desk Address */}
            <div className="bg-[#E6F4EA]/60 border border-[#A8DAB5] rounded-card p-6 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#A8DAB5] flex items-center justify-center text-[#00843D]">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-montserrat font-bold text-base text-[#00843D]">
                Certificate Verification Desk
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                Dedicated desk for participant name rectifications, replacement certifications, or employer background verifications:
              </p>
              <a
                href={`mailto:${settings.emailVerify}?subject=Certificate%20Verification%20Query`}
                className="text-xs font-bold text-[#00843D] underline break-all block font-mono"
              >
                {settings.emailVerify}
              </a>
              <div className="pt-2">
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00843D] bg-white border border-[#A8DAB5] px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <ShieldCheck size={13} />
                  <span>Open Online Verification Search &rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Enquiry Form with Anti-Spam Security Challenge (Right 2 Columns) */}
          <div className="lg:col-span-2 bg-white border border-ieee-border rounded-card p-8 md:p-10 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider mb-1">
                <MessageSquare size={14} /> Direct Communications Form
              </div>
              <h3 className="font-montserrat font-bold text-xl text-ieee-navy">
                Send an Official Message
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Your message will be delivered directly to the chapter secretariat and executive committee at <strong className="text-gray-700">ieeecsiub.contact@gmail.com</strong>.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 bg-[#E6F4EA] border border-[#A8DAB5] rounded-xl text-xs text-[#00843D] space-y-3">
                <div className="flex items-center gap-2 text-base font-bold">
                  <CheckCircle size={20} />
                  <span>Message Dispatched Successfully</span>
                </div>
                <p className="leading-relaxed">
                  Thank you, <strong>{name}</strong>. Our communications secretary will review
                  your inquiry and respond back to <strong>{email}</strong> within 24–48 business hours.
                </p>
                <div className="p-3 bg-white/70 rounded-lg border border-[#A8DAB5] text-[11px] text-gray-700">
                  <span>A copy of your query has been recorded. For urgent matters, feel free to email directly to <strong>ieeecsiub.contact@gmail.com</strong> or message on WhatsApp.</span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setSubject("");
                      setMessage("");
                      setCaptchaAnswer("");
                    }}
                    className="text-xs underline font-bold hover:text-emerald-900"
                  >
                    Send another query
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Engr. Hamza"
                      className="w-full px-3.5 py-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Your Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ieeecsiub.contact@gmail.com"
                      className="w-full px-3.5 py-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Subject / Topic *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Workshop Collaboration / Speaker Proposal / Certificate Inquiry"
                    className="w-full px-3.5 py-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Message Details *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your detailed query or message here..."
                    className="w-full px-3.5 py-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                {/* Anti-Spam CAPTCHA */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <HelpCircle size={14} className="text-ieee-blue" />
                    <span>Security Challenge: What is 5 + 3? *</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Enter answer in digits (e.g. 8)"
                    className="w-48 px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none text-xs"
                  />
                </div>

                <Button type="submit" variant="primary" size="md">
                  <Send size={15} className="mr-2" /> Submit Enquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
