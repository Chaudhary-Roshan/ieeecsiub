import React from "react";
import Link from "next/link";
import { CHAPTER_INFO } from "@/lib/constants";
import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle, FileText } from "lucide-react";

export default function CertificatePolicyPage() {
  return (
    <div className="flex-1 bg-white py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Academic & Credential Integrity
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Official Certificate Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Standard operating procedure governing the generation, staging, dual-officer
            approval, lifecycle revocation, and verification of chapter recognition awards.
          </p>
        </div>

        {/* Section 1: Official Issuer Statement */}
        <div className="p-6 bg-ieee-surfaceTint/50 border border-ieee-border rounded-card space-y-3">
          <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
            <ShieldCheck className="text-ieee-blue" size={20} />
            Mandatory Issuer Statement
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            Every certificate issued by the IEEE Computer Society Student Branch Chapter at
            UCET-IUB carries the following explicit recognition notice:
          </p>
          <div className="p-4 bg-white rounded-lg border border-ieee-border font-mono text-xs font-semibold text-ieee-navy">
            &ldquo;{CHAPTER_INFO.issuerStatementDefault}&rdquo;
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            {CHAPTER_INFO.credentialDisclaimer} Chapter awards recognize participation,
            merit, and completion in university workshops and hackathons.
          </p>
        </div>

        {/* Section 2: Recognition Levels */}
        <div className="space-y-4">
          <h2 className="text-xl font-montserrat font-bold text-ieee-navy">
            Recognition Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 border border-ieee-border rounded-xl space-y-2 bg-gray-50">
              <span className="font-bold text-ieee-navy text-sm block">
                1. Chapter-Issued Recognition
              </span>
              <p className="text-gray-600 leading-relaxed">
                Awarded for standalone workshops, seminars, and technical bootcamps hosted
                exclusively by the chapter at UCET-IUB. Signed by the Chapter Chair and
                Faculty Advisor.
              </p>
            </div>

            <div className="p-5 border border-ieee-border rounded-xl space-y-2 bg-gray-50">
              <span className="font-bold text-ieee-navy text-sm block">
                2. Joint Partner Recognition
              </span>
              <p className="text-gray-600 leading-relaxed">
                Awarded in collaboration with industrial partners (such as EnlivenAI) or
                academic departments. Displays the co-branded partner logo and joint
                signatory role.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Two-Officer Approval Model */}
        <div className="space-y-4">
          <h2 className="text-xl font-montserrat font-bold text-ieee-navy">
            Dual-Officer Approval Mandate
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            To prevent fraud and maintain institutional integrity:
          </p>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle size={15} className="text-status-active flex-shrink-0 mt-0.5" />
              <span>
                <strong>Staging Phase:</strong> Event coordinators or Site Admins prepare and
                upload CSV participant lists to an isolated staging batch.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={15} className="text-status-active flex-shrink-0 mt-0.5" />
              <span>
                <strong>Second-Officer Approval:</strong> Records cannot go live on the public
                registry until reviewed and signed off by a designated Certificate Approver
                (Chapter Chair or Faculty Advisor).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={15} className="text-status-active flex-shrink-0 mt-0.5" />
              <span>
                <strong>Separation of Powers:</strong> The Site Admin cannot approve certificates
                independently.
              </span>
            </li>
          </ul>
        </div>

        {/* Section 4: Lifecycle Revocation and Replacement */}
        <div className="space-y-4">
          <h2 className="text-xl font-montserrat font-bold text-ieee-navy">
            Corrections, Replacements, and Revocations
          </h2>
          <div className="space-y-3 text-xs text-gray-700">
            <div className="p-4 bg-[#FEF3D6] border border-[#FAD79A] rounded-xl flex items-start gap-3">
              <RefreshCw className="text-[#E87722] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <span className="font-bold text-[#E87722] text-sm block">
                  Name Corrections (Status: Replaced)
                </span>
                <p className="mt-1 leading-relaxed text-[#B45309]">
                  If a participant name was misspelled, the old code is marked as{" "}
                  <strong>REPLACED</strong> with an explicit pointer to the newly issued code.
                  Records are never permanently deleted from history.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FCE8E6] border border-[#F5C2BE] rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-[#BA0C2F] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <span className="font-bold text-[#BA0C2F] text-sm block">
                  Invalidation (Status: Revoked)
                </span>
                <p className="mt-1 leading-relaxed text-[#990a26]">
                  If a certificate was issued erroneously or due to unmet attendance criteria,
                  it is permanently flagged as <strong>REVOKED</strong> with the revocation
                  date and documented rationale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
