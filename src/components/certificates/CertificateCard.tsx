import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CertificateRecord } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CHAPTER_INFO } from "@/lib/constants";
import { formatPKTDateOnly } from "@/lib/sha256";
import { formatTeamMembersBullets, formatTeamMembersProse } from "@/lib/teamCertUtils";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Info,
  Calendar,
  Award,
  UserCheck,
  Building,
  Printer,
} from "lucide-react";

interface CertificateCardProps {
  certificate: CertificateRecord;
  onOpenPdfVerifier?: () => void;
  onDownloadPdf?: () => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onOpenPdfVerifier,
  onDownloadPdf,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isReplaced = certificate.status === "REPLACED";
  const isRevoked = certificate.status === "REVOKED";
  const isActive = certificate.status === "ACTIVE";

  return (
    <div className="bg-white border border-ieee-border rounded-card shadow-sm overflow-hidden transition-all duration-200">
      {/* Top Banner Status Header */}
      <div
        className={`px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b ${
          isActive
            ? "bg-[#F0FDF4] border-[#BBF7D0]"
            : isRevoked
            ? "bg-[#FEF2F2] border-[#FECACA]"
            : "bg-[#FFFBEB] border-[#FDE68A]"
        }`}
      >
        <div className="flex items-center gap-2">
          {isActive && <ShieldCheck className="text-[#00843D]" size={22} />}
          {isRevoked && <AlertTriangle className="text-[#BA0C2F]" size={22} />}
          {isReplaced && <RefreshCw className="text-[#E87722]" size={22} />}

          <span className="font-montserrat font-bold text-sm text-ieee-navy">
            {isActive && "Official Valid Certificate"}
            {isRevoked && "Certificate Revoked"}
            {isReplaced && "Certificate Replaced / Superseded"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge status={certificate.status} />
        </div>
      </div>

      {/* Revocation Warning Alert Box */}
      {isRevoked && (
        <div className="mx-6 mt-6 p-4 bg-[#FCE8E6] border border-[#F5C2BE] rounded-lg text-sm text-[#BA0C2F]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold">Revocation Notice</p>
              <p className="mt-1 text-xs text-[#990a26] leading-relaxed">
                This certificate was revoked on{" "}
                <span className="font-semibold">
                  {certificate.revocationDate || "an official administrative review"}
                </span>
                . Reason:{" "}
                <em>{certificate.revocationReason || "Administrative invalidation."}</em>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Link Alert Box */}
      {isReplaced && certificate.replacedByCode && (
        <div className="mx-6 mt-6 p-4 bg-[#FEF3D6] border border-[#FAD79A] rounded-lg text-sm text-[#E87722]">
          <div className="flex items-start gap-2.5">
            <RefreshCw className="flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold">Certificate Has Been Superseded</p>
              <p className="mt-1 text-xs text-[#B45309] leading-relaxed">
                {certificate.replacementReason ||
                  "A corrected certificate was issued for this participant."}
              </p>
              <div className="mt-2.5">
                <Link
                  href={`/verify/${certificate.replacedByCode}`}
                  className="inline-flex items-center gap-1.5 font-montserrat font-bold text-xs bg-white text-[#E87722] border border-[#E87722] px-3 py-1.5 rounded-full hover:bg-[#E87722] hover:text-white transition-colors"
                >
                  View Replacement Record ({certificate.replacedByCode}){" "}
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Recipient Header */}
        <div className="border-b border-ieee-border pb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Image
              src="/ieee-cs-logo.png"
              alt="IEEE Computer Society"
              width={140}
              height={43}
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="text-[11px] font-montserrat font-bold text-ieee-blue uppercase tracking-wider hidden sm:inline-block">
              Official Chapter Registry
            </span>
          </div>
          <span className="text-xs uppercase tracking-wider font-semibold text-ieee-muted block mb-1">
            {certificate.teamName ? "THIS CERTIFICATE IS PROUDLY PRESENTED TO" : "Certified Recipient"}
          </span>
          <h2 className="text-2xl md:text-3xl font-montserrat font-extrabold text-ieee-navy">
            {certificate.teamName ? `TEAM ${certificate.teamName.toUpperCase()}` : certificate.recipientName}
          </h2>
          {certificate.teamName && certificate.recipientName && (
            <div className="mt-1 text-sm text-gray-600 font-medium">
              Registered Attendee: <span className="font-semibold text-gray-800">{certificate.recipientName}</span>
            </div>
          )}
          {(certificate.recipientRollNumber || certificate.recipientEmail) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {certificate.recipientRollNumber && (
                <span className="bg-ieee-blue/10 text-ieee-blue font-mono font-bold text-xs px-2.5 py-1 rounded-md uppercase">
                  Roll No: {certificate.recipientRollNumber}
                </span>
              )}
              {certificate.recipientEmail && (
                <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md">
                  Email: {certificate.recipientEmail}
                </span>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-mono font-medium">
              <span>Code: {certificate.code}</span>
              <button
                onClick={handleCopyCode}
                className="hover:text-ieee-blue transition-colors ml-1 p-0.5"
                title="Copy Code"
              >
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              </button>
            </div>
            <span className="text-xs text-ieee-muted">
              Source:{" "}
              {certificate.source === "UPLOAD_REGISTRY"
                ? "Official Batch Registry"
                : certificate.source === "IN_SITE_GENERATED"
                ? "In-Site Generated System Verification"
                : "Legacy Archive"}
            </span>
          </div>
        </div>

        {/* Team & Technical Project Details */}
        {(certificate.teamName || certificate.projectTitle) && (
          <div className="p-5 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-amber-50/70 border border-blue-200/90 rounded-2xl space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="bg-ieee-navy text-white text-[10px] font-bold px-2.5 py-1 rounded font-montserrat tracking-wider uppercase">
                Technical Project &amp; Team Credential
              </span>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded font-mono">
                {certificate.semester ? `${certificate.semester} Semester` : (certificate.projectDomain || "UCET IUB")}
              </span>
            </div>

            {/* Team Members & Contributors */}
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                Team Members &amp; Contributors
              </span>
              <div className="font-montserrat font-bold text-base text-gray-900 leading-snug">
                {formatTeamMembersBullets(certificate.teamMembers || [certificate.recipientName])}
              </div>
              <p className="text-xs text-gray-600 mt-1 font-medium">
                ({certificate.semester ? `${certificate.semester} Semester, ` : ""}{certificate.department || "Department of Computer Science & IT / UCET"})
              </p>
            </div>

            {/* In Recognition of Their Technical Project */}
            {certificate.projectTitle && (
              <div className="pt-3 border-t border-blue-200/70">
                <span className="text-[11px] font-bold text-ieee-blue uppercase tracking-wider block mb-1">
                  In Recognition of Their Technical Project
                </span>
                <div className="font-montserrat font-extrabold text-lg text-ieee-navy">
                  &ldquo;{certificate.projectTitle}&rdquo;
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Presented at the <strong className="text-gray-900 font-semibold">{certificate.eventTitle}</strong> on <strong className="text-gray-900 font-semibold">{formatPKTDateOnly(certificate.activityDate)}</strong>.
                </p>
              </div>
            )}

            {/* Certified Team Member Badges */}
            {certificate.teamMembers && certificate.teamMembers.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase mr-1">Roster:</span>
                {certificate.teamMembers.map((member, i) => {
                  const isRecipient = member.trim().toLowerCase() === certificate.recipientName.trim().toLowerCase();
                  return (
                    <span
                      key={i}
                      className={`px-2.5 py-0.5 rounded text-xs border transition-all ${
                        isRecipient
                          ? "bg-ieee-blue text-white border-ieee-blue font-bold shadow-2xs"
                          : "bg-white text-gray-800 border-gray-200 font-medium"
                      }`}
                    >
                      {member} {isRecipient ? "★ (Queried Recipient)" : ""}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2-Column Details Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-ieee-muted block font-semibold flex items-center gap-1.5">
                <Award size={14} className="text-ieee-blue" /> Event / Program
              </span>
              <p className="font-montserrat font-semibold text-gray-900 mt-1">
                {certificate.eventTitle}
              </p>
            </div>

            <div>
              <span className="text-xs text-ieee-muted block font-semibold flex items-center gap-1.5">
                <FileText size={14} className="text-ieee-blue" /> Recognition Type
              </span>
              <p className="font-medium text-gray-800 mt-1">
                {certificate.certificateType}
              </p>
            </div>

            <div>
              <span className="text-xs text-ieee-muted block font-semibold flex items-center gap-1.5">
                <Building size={14} className="text-ieee-blue" /> Issuing Organization
              </span>
              <p className="text-gray-800 mt-1">
                {CHAPTER_INFO.fullName}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-ieee-muted block font-semibold flex items-center gap-1.5">
                <Calendar size={14} className="text-ieee-blue" /> Activity Date
              </span>
              <p className="text-gray-800 mt-1">
                {formatPKTDateOnly(certificate.activityDate)}
              </p>
            </div>

            <div>
              <span className="text-xs text-ieee-muted block font-semibold flex items-center gap-1.5">
                <Calendar size={14} className="text-ieee-blue" /> Date of Issuance
              </span>
              <p className="text-gray-800 mt-1">
                {formatPKTDateOnly(certificate.issueDate)}
              </p>
            </div>

            <div>
              <span className="text-xs text-ieee-muted block font-semibold flex items-center gap-1.5">
                <UserCheck size={14} className="text-ieee-blue" /> Approved By
              </span>
              <p className="text-gray-800 mt-1">
                <span className="font-medium">{certificate.approverName}</span>{" "}
                <span className="text-xs text-ieee-muted">({certificate.approverRole})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Verification Compare Notice (Mandatory per specification) */}
        <div className="p-4 bg-ieee-surfaceTint/50 rounded-xl border border-ieee-border text-xs text-ieee-navy flex items-start gap-2.5">
          <Info size={18} className="text-ieee-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Physical Certificate Cross-Check</p>
            <p className="mt-0.5 text-gray-700 leading-relaxed">
              Compare the recipient name, event title, dates, and recognition type shown
              above with the certificate document in your possession. All parameters must
              match completely.
            </p>
          </div>
        </div>

        {/* Official Issuer Recognition Statement */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ieee-navy font-montserrat uppercase tracking-wider text-[11px]">
              ISSUER STATEMENT
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              IEEE Computer Society SBC UCET
            </span>
          </div>
          <p className="italic text-sm text-gray-800 leading-relaxed font-serif">
            &ldquo;{certificate.issuerStatement || CHAPTER_INFO.issuerStatementDefault}&rdquo;
          </p>
          <div className="pt-2 border-t border-gray-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600">
            <div>
              <span className="font-semibold text-gray-800 font-montserrat">{certificate.approverName || "Muhammad Roshan Ashraf"}</span>
              <span className="text-gray-500 ml-1.5">Chapter Chair, IEEE CS UCET-IUB</span>
            </div>
            <span className="text-[10px] text-gray-400">{CHAPTER_INFO.credentialDisclaimer}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-ieee-border">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center justify-center font-montserrat font-bold text-xs uppercase tracking-wider rounded-button transition-all duration-200 px-4 py-2 bg-ieee-navy text-white hover:bg-ieee-blue shadow-sm"
            >
              {copied ? <Check size={14} className="mr-1.5 text-green-400" /> : <Copy size={14} className="mr-1.5" />}
              {copied ? "Verification Code Copied!" : "Copy Verification Code"}
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center font-montserrat font-semibold text-xs rounded-button transition-all duration-200 px-3.5 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-2xs"
            >
              <Printer size={14} className="mr-1.5 text-gray-500" /> Print Verification Summary
            </button>
          </div>

          <div className="text-xs text-ieee-muted">
            Questions? Contact{" "}
            <a
              href={`mailto:${CHAPTER_INFO.contacts.verify}?subject=Verification%20Query%20${certificate.code}`}
              className="text-ieee-blue underline font-medium hover:text-ieee-navy"
            >
              {CHAPTER_INFO.contacts.verify}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
