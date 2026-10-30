import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, Database, Server } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 bg-white py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Data Governance & Protection
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Data Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            In accordance with international privacy principles (GDPR-standard) and
            Pakistan&apos;s Personal Data Protection framework.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
              <Eye size={18} className="text-ieee-blue" /> 1. Public vs. Private Data
            </h2>
            <p>
              The public <code>/verify</code> portal exposes <strong>only</strong> the recipient
              name, event title, activity dates, recognition type, and certificate validity status.
            </p>
            <p className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              Personal contact details—including student email addresses, mobile phone numbers,
              university roll numbers, payment transaction slips, and physical attendance
              timestamps—remain strictly confidential and accessible solely to authorized chapter
              officers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
              <Lock size={18} className="text-ieee-blue" /> 2. Consent & Name Display Formats
            </h2>
            <p>
              During registration or batch upload, participants select whether their full legal
              name or a truncated format (First Name + Initial) appears on the public registry.
              Participants also explicitly grant or withhold consent for photography during
              technical workshops.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
              <Database size={18} className="text-ieee-blue" /> 3. Payment Proof Retention
            </h2>
            <p>
              Screenshots of bank transfers and Raast transaction receipts uploaded for workshop
              seat confirmations are stored in private encrypted storage buckets. All payment proofs
              are automatically deleted after 12 months following event closure and financial
              audit reconciliation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
              <Server size={18} className="text-ieee-blue" /> 4. Security & Audit Logging
            </h2>
            <p>
              All administrative access requires mandatory Two-Factor Authentication (2FA). Every
              action taken by chapter staff—such as uploading a batch, approving a certificate,
              revoking a credential, or verifying a fee—is immutably preserved in an append-only
              audit table.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
