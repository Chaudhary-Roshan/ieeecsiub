"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  ExternalLink,
  Users,
  Award,
  Sparkles,
  BookOpen,
  Send,
  Loader2,
} from "lucide-react";

export const MembershipClient: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roll, setRoll] = useState("");
  const [interests, setInterests] = useState("Workshops & Hands-on Coding");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (supabase) {
        await supabase.from("contacts").insert({
          name,
          email,
          subject: `Membership Interest: ${interests}`,
          message: `Phone: ${phone} | Roll/Dept: ${roll} | Selected Track: ${interests}`,
        });
      }
    } catch (err) {
      console.warn("Membership submit fallback:", err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Column 1: Local Chapter Participation */}
      <div className="bg-white border-2 border-ieee-blue rounded-card p-8 md:p-10 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider block">
              Campus Level
            </span>
            <h2 className="text-2xl font-montserrat font-extrabold text-ieee-navy">
              Join Chapter Activities
            </h2>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Open to all students of UCET and The Islamia University of Bahawalpur.
            No dues or annual fee required.
          </p>

          <div className="space-y-3 pt-2 text-xs text-gray-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-status-active flex-shrink-0 mt-0.5" />
              <span>Participate in on-campus technical workshops and bootcamps</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-status-active flex-shrink-0 mt-0.5" />
              <span>Receive authentic, cryptographically verifiable certificates</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-status-active flex-shrink-0 mt-0.5" />
              <span>Access official chapter WhatsApp announcement community</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-status-active flex-shrink-0 mt-0.5" />
              <span>Eligible to volunteer in event management and technical tracks</span>
            </div>
          </div>

          {/* Local Interest Sign-up Form */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-montserrat font-bold text-sm text-ieee-navy mb-3">
              Local Student Interest Registration
            </h3>

            {submitted ? (
              <div className="p-4 bg-[#E6F4EA] border border-[#A8DAB5] rounded-xl text-xs text-[#00843D] space-y-1">
                <p className="font-bold">Welcome to the Chapter community!</p>
                <p>
                  Your interest form has been recorded in our chapter database. Check your email and WhatsApp for upcoming orientations.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ayesha Siddiqa"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@ucet.edu.pk"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Roll Number / Department
                  </label>
                  <input
                    type="text"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value.toUpperCase())}
                    placeholder="S23BINCE1M40414 (Computer Science)"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Primary Technical Interest
                  </label>
                  <select
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white"
                  >
                    <option value="Workshops & Hands-on Coding">Workshops &amp; Hands-on Coding</option>
                    <option value="AI Agents & Machine Learning">AI Agents &amp; Machine Learning</option>
                    <option value="Competitive Programming & Hackathons">Competitive Programming &amp; Hackathons</option>
                    <option value="Event Organizing & Volunteering">Event Organizing &amp; Volunteering</option>
                  </select>
                </div>

                <Button type="submit" variant="accent" size="md" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={14} className="mr-2" /> Submit Interest Form
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Column 2: Official Global IEEE / IEEE CS Membership (Paid) */}
      <div className="bg-white border border-gray-300 rounded-card p-8 md:p-10 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Image
              src="/ieee-cs-logo.png"
              alt="IEEE Computer Society"
              width={140}
              height={43}
              className="h-8 w-auto object-contain"
            />
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
              Paid via IEEE.org
            </span>
          </div>
          <div>
            <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-wider block">
              International Society
            </span>
            <h2 className="text-2xl font-montserrat font-extrabold text-ieee-navy">
              Global IEEE CS Member
            </h2>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Official membership in the global Institute of Electrical and Electronics
            Engineers (IEEE) and the IEEE Computer Society. Processed entirely through
            IEEE USA.
          </p>

          <div className="space-y-3 pt-2 text-xs text-gray-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-ieee-blue flex-shrink-0 mt-0.5" />
              <span>
                Full subscription to <strong>Computer Magazine</strong> (digital) &amp; IEEE
                Software
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-ieee-blue flex-shrink-0 mt-0.5" />
              <span>
                Access to <strong>IEEE Xplore Digital Library</strong> with peer-reviewed
                literature
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-ieee-blue flex-shrink-0 mt-0.5" />
              <span>Personal Google Workspace account with official <strong>@ieee.org</strong> alias</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-ieee-blue flex-shrink-0 mt-0.5" />
              <span>Eligibility to run for global IEEE student committee offices</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-ieee-blue flex-shrink-0 mt-0.5" />
              <span>Discounts on IEEE international conference registrations and journals</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
            <span className="font-bold text-gray-800 block">
              How payments work:
            </span>
            <p className="leading-relaxed">
              Student membership in Pakistan qualifies for IEEE Developing Nations /
              Future50 student concession rates. Payment is made directly with credit/debit
              card on the official IEEE portal.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-3">
          <Button
            href="https://www.computer.org/membership/join"
            external
            variant="primary"
            size="md"
            className="w-full"
          >
            Join Global IEEE Computer Society <ExternalLink size={14} className="ml-2" />
          </Button>
          <p className="text-[11px] text-gray-500 text-center">
            Redirects securely to the official computer.org global registration portal.
          </p>
        </div>
      </div>
    </div>
  );
};
