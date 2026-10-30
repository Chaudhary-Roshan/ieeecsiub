import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CertificateRecord } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CHAPTER_INFO } from "@/lib/constants";
import { formatPKTDateOnly } from "@/lib/sha256";
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
            Certified Recipient
          </span>
          <h2 className="text-2xl md:text-3xl font-montserrat font-extrabold text-ieee-navy">
            {certificate.recipientName}
          </h2>
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
                ? "In-Site Generated"
                : "Legacy Archive"}
            </span>
          </div>
        </div>

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
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-800">Official Issuer Statement:</p>
          <p className="italic">
            &ldquo;{certificate.issuerStatement || CHAPTER_INFO.issuerStatementDefault}&rdquo;
          </p>
          <p className="text-[11px] text-gray-500 pt-1">
            {CHAPTER_INFO.credentialDisclaimer}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-ieee-border">
          <div className="flex items-center gap-3 flex-wrap">
            {isActive && (
              <Link
                href={`/verify/${certificate.code}/certificate`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center font-montserrat font-bold text-xs uppercase tracking-wider rounded-button transition-all duration-200 px-4 py-2 bg-ieee-navy text-white hover:bg-ieee-blue shadow-sm"
              >
                <Printer size={14} className="mr-1.5" /> View & Print Certificate
              </Link>
            )}

            {onDownloadPdf && isActive && (
              <Button onClick={onDownloadPdf} variant="outline" size="sm">
                <FileText size={14} className="mr-1.5" /> Direct PDF
              </Button>
            )}

            {onOpenPdfVerifier && (
              <Button onClick={onOpenPdfVerifier} variant="outline" size="sm">
                Verify PDF Original (SHA-256)
              </Button>
            )}
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
