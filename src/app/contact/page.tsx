"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CHAPTER_INFO } from "@/lib/constants";
import {
  Mail,
  MapPin,
  ShieldCheck,
  Send,
  MessageSquare,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaAnswer.trim() !== "8") {
      alert("Please solve the security challenge (5 + 3 = ?)");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Communications Desk
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Contact IEEE CS UCET-IUB
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Have questions regarding upcoming technical workshops, partnership inquiries, or
            certificate authentications? Get in touch with our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contact Details & Addresses (Left Column) */}
          <div className="space-y-6">
            {/* Physical Location */}
            <div className="bg-white border border-ieee-border rounded-card p-6 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-ieee-surfaceTint flex items-center justify-center text-ieee-blue">
                <MapPin size={20} />
              </div>
              <h3 className="font-montserrat font-bold text-base text-ieee-navy">
                Chapter Location
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Department of Computer Science & Engineering,
                <br />
                University College of Engineering & Technology (UCET),
                <br />
                Baghdad-ul-Jadeed Campus, The Islamia University of Bahawalpur,
                Punjab 63100, Pakistan.
              </p>
            </div>

            {/* General Chapter Email */}
            <div className="bg-white border border-ieee-border rounded-card p-6 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-status-active">
                <Mail size={20} />
              </div>
              <h3 className="font-montserrat font-bold text-base text-ieee-navy">
                General Inquiries
              </h3>
              <p className="text-xs text-gray-600">
                For workshops, executive communications, and speaking proposals:
              </p>
              <a
                href={`mailto:${CHAPTER_INFO.contacts.general}`}
                className="text-xs font-semibold text-ieee-blue hover:underline break-all block"
              >
                {CHAPTER_INFO.contacts.general}
              </a>
            </div>

            {/* Separate Certificate Verification Desk Address (Spec Requirement) */}
            <div className="bg-[#E6F4EA]/60 border border-[#A8DAB5] rounded-card p-6 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#A8DAB5] flex items-center justify-center text-[#00843D]">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-montserrat font-bold text-base text-[#00843D]">
                Certificate Verification Desk
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                Dedicated inbox for participant name rectifications, replacement
                certifications, or employer background verifications:
              </p>
              <a
                href={`mailto:${CHAPTER_INFO.contacts.verify}`}
                className="text-xs font-bold text-[#00843D] underline break-all block font-mono"
              >
                {CHAPTER_INFO.contacts.verify}
              </a>
            </div>
          </div>

          {/* Enquiry Form with CAPTCHA (Right 2 Columns) */}
          <div className="lg:col-span-2 bg-white border border-ieee-border rounded-card p-8 md:p-10 shadow-sm space-y-6">
            <div>
              <h3 className="font-montserrat font-bold text-xl text-ieee-navy">
                Send an Official Message
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Your message will be routed directly to the chapter secretariat and executive committee.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 bg-[#E6F4EA] border border-[#A8DAB5] rounded-xl text-xs text-[#00843D] space-y-2">
                <div className="flex items-center gap-2 text-base font-bold">
                  <CheckCircle size={20} />
                  <span>Message Dispatched Successfully</span>
                </div>
                <p>
                  Thank you, <strong>{name}</strong>. Our communications secretary will review
                  your inquiry and respond back to <strong>{email}</strong> within 48 business hours.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs underline font-semibold"
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
                      placeholder="hamza@example.com"
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
                    placeholder="e.g. Workshop Collaboration / Speaker Proposal"
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

                {/* Simple Anti-Spam CAPTCHA */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <label className="block font-semibold text-gray-700">
                    Security Challenge: What is 5 + 3? *
                  </label>
                  <input
                    type="text"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Enter answer in digits"
                    className="w-40 px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
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
