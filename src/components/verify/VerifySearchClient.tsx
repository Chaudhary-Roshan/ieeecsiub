"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PdfVerifyModal } from "@/components/certificates/PdfVerifyModal";
import { normalizeVerificationCode } from "@/lib/codeGenerator";
import { ShieldCheck, Search, FileCheck2, AlertCircle } from "lucide-react";

export const VerifySearchClient: React.FC = () => {
  const router = useRouter();
  const [inputCode, setInputCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeVerificationCode(inputCode);
    if (!clean) {
      setErrorMsg("Please enter a verification code, roll number, or paste verification link.");
      return;
    }
    setErrorMsg("");
    router.push(`/verify/${encodeURIComponent(clean)}`);
  };

  return (
    <>
      <div className="bg-white border border-ieee-border rounded-card p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            htmlFor="cert-code-input"
            className="block font-montserrat font-bold text-xs uppercase tracking-wider text-gray-700"
          >
            Verification Code, Roll Number, CNIC, or Passport Number
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ieee-muted">
              <Search size={20} />
            </div>
            <input
              id="cert-code-input"
              type="text"
              placeholder="e.g. CSIUB-26-AXNE-UX4T, 31202-1234567-1, PA1234567, or Roll No"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.toUpperCase());
                setErrorMsg("");
              }}
              className="w-full pl-12 pr-4 py-3.5 text-base md:text-lg font-mono uppercase tracking-wider border border-gray-300 rounded-xl focus:ring-2 focus:ring-ieee-blue focus:border-ieee-blue outline-none transition-all placeholder:normal-case placeholder:font-sans placeholder:text-gray-400"
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
      </div>

      <PdfVerifyModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
      />
    </>
  );
};
