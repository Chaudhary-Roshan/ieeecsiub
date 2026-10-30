"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PdfVerifyModal } from "@/components/certificates/PdfVerifyModal";
import { CHAPTER_INFO } from "@/lib/constants";
import {
  ShieldCheck,
  Search,
  FileCheck2,
  Lock,
  QrCode,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [inputCode, setInputCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setErrorMsg("Please enter a certificate verification code.");
      return;
    }
    setErrorMsg("");
    router.push(`/verify/${clean}`);
  };

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Page Title & Subtitle */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-ieee-surfaceTint text-ieee-navy text-xs font-montserrat font-bold px-3.5 py-1.5 rounded-full border border-ieee-border">
            <ShieldCheck size={16} className="text-ieee-blue" />
            Official IEEE CS UCET-IUB Certificate Registry
          </div>

          <h1 className="text-3xl sm:text-4xl font-montserrat font-extrabold text-ieee-navy">
            Verify a Certificate
          </h1>

          <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Enter the alphanumeric verification code printed at the bottom of the
            certificate or scan the QR code to confirm its authentic issuance.
          </p>
        </div>

        {/* Central Search Box Card */}
        <div className="bg-white border border-ieee-border rounded-card p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label
              htmlFor="cert-code-input"
              className="block font-montserrat font-bold text-xs uppercase tracking-wider text-gray-700"
            >
              Certificate Code
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ieee-muted">
                <Search size={20} />
              </div>
              <input
                id="cert-code-input"
                type="text"
                placeholder="e.g. CSIUB-26-7K3M-Q9TC"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full pl-12 pr-4 py-3.5 text-base md:text-lg font-mono tracking-wider uppercase border border-gray-300 rounded-xl focus:ring-2 focus:ring-ieee-blue focus:border-ieee-blue outline-none transition-all placeholder:normal-case placeholder:font-sans placeholder:text-gray-400"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-status-revoked font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} /> {errorMsg}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
                <ShieldCheck size={16} className="mr-2" /> Verify Now
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => setPdfModalOpen(true)}
              >
                <FileCheck2 size={16} className="mr-2" /> Check Original PDF (SHA-256)
              </Button>
            </div>
          </form>

          {/* Quick Demo Pre-filled Links for Evaluator Convenience */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <span className="text-[11px] font-montserrat font-bold uppercase tracking-wider text-ieee-muted block mb-2">
              Try sample demonstration codes:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInputCode("CSIUB-26-7K3M-Q9TC")}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-mono transition-colors"
              >
                Active: CSIUB-26-7K3M-Q9TC
              </button>
              <button
                type="button"
                onClick={() => setInputCode("CSIUB-26-8J2N-K1RD")}
                className="text-xs bg-[#FEF3D6] hover:bg-[#FAD79A] text-[#B45309] px-3 py-1 rounded-full font-mono transition-colors"
              >
                Replaced: CSIUB-26-8J2N-K1RD
              </button>
              <button
                type="button"
                onClick={() => setInputCode("CSIUB-26-4L8X-Z2VC")}
                className="text-xs bg-[#FCE8E6] hover:bg-[#F5C2BE] text-[#BA0C2F] px-3 py-1 rounded-full font-mono transition-colors"
              >
                Revoked: CSIUB-26-4L8X-Z2VC
              </button>
            </div>
          </div>
        </div>

        {/* Informational Guidance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-600">
          <div className="bg-white border border-ieee-border rounded-xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-ieee-surfaceTint flex items-center justify-center text-ieee-blue">
              <QrCode size={18} />
            </div>
            <h4 className="font-montserrat font-bold text-gray-900 text-sm">
              Instant QR Scanning
            </h4>
            <p className="leading-relaxed">
              Every certificate issued by the chapter includes a secure QR code.
              Scanning with any smartphone opens this verification page in under 3 seconds.
            </p>
          </div>

          <div className="bg-white border border-ieee-border rounded-xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-status-active">
              <Lock size={18} />
            </div>
            <h4 className="font-montserrat font-bold text-gray-900 text-sm">
              Privacy Preserving
            </h4>
            <p className="leading-relaxed">
              Verification displays solely the authorized public name and event details.
              Private student emails, phone numbers, and roll numbers are never exposed.
            </p>
          </div>

          <div className="bg-white border border-ieee-border rounded-xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3D6] flex items-center justify-center text-ieee-orange">
              <HelpCircle size={18} />
            </div>
            <h4 className="font-montserrat font-bold text-gray-900 text-sm">
              Verification Queries
            </h4>
            <p className="leading-relaxed">
              Legacy certificates or name spelling queries can be directed to{" "}
              <a
                href={`mailto:${CHAPTER_INFO.contacts.verify}`}
                className="text-ieee-blue font-semibold underline"
              >
                {CHAPTER_INFO.contacts.verify}
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* PDF Verification Modal */}
      <PdfVerifyModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
      />
    </div>
  );
}
