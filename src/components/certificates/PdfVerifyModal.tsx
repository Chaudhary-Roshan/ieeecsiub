"use client";

import React, { useState } from "react";
import { computeFileSha256 } from "@/lib/sha256";
import { Button } from "../ui/Button";
import { X, UploadCloud, CheckCircle2, XCircle, FileText, AlertCircle } from "lucide-react";

interface PdfVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCertificateCode?: string;
  expectedSha256?: string;
}

export const PdfVerifyModal: React.FC<PdfVerifyModalProps> = ({
  isOpen,
  onClose,
  targetCertificateCode,
  expectedSha256,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [computing, setComputing] = useState(false);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<"MATCH" | "MISMATCH" | "NO_REFERENCE" | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setComputing(true);
    setComputedHash(null);
    setMatchResult(null);

    try {
      const hash = await computeFileSha256(selected);
      setComputedHash(hash);

      if (expectedSha256) {
        if (hash.toLowerCase() === expectedSha256.toLowerCase()) {
          setMatchResult("MATCH");
        } else {
          setMatchResult("MISMATCH");
        }
      } else {
        setMatchResult("NO_REFERENCE");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setComputing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setComputedHash(null);
    setMatchResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-card max-w-lg w-full border border-ieee-border shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-ieee-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-ieee-cyan" size={20} />
            <h3 className="font-montserrat font-bold text-base">
              Original PDF Cryptographic Verification
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-gray-600 leading-relaxed">
            Upload the original issued PDF certificate file to compute its client-side{" "}
            <strong>SHA-256 cryptographic digest</strong>. If any byte, text, or signature
            in the PDF has been altered, the fingerprint will not match.
          </p>

          {targetCertificateCode && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs flex justify-between items-center">
              <span className="text-gray-600">Verifying Against Record:</span>
              <span className="font-mono font-bold text-ieee-navy">
                {targetCertificateCode}
              </span>
            </div>
          )}

          {/* Upload Area */}
          {!file ? (
            <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-ieee-blue hover:bg-ieee-surfaceTint/20 transition-all text-center">
              <UploadCloud size={40} className="text-ieee-blue mb-2" />
              <span className="font-montserrat font-semibold text-sm text-gray-800">
                Choose or drag original PDF
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Accepts .pdf files only
              </span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 truncate">
                  <FileText size={18} className="text-ieee-blue flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-red-600 hover:underline"
                >
                  Change
                </button>
              </div>

              {computing ? (
                <p className="text-xs text-ieee-blue animate-pulse">
                  Computing SHA-256 fingerprint in browser...
                </p>
              ) : computedHash ? (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="text-[11px] font-mono break-all bg-white p-2.5 rounded border border-gray-200">
                    <span className="text-gray-500 block mb-0.5 font-sans font-semibold">
                      Computed SHA-256 Fingerprint:
                    </span>
                    <span className="text-ieee-navy font-bold">{computedHash}</span>
                  </div>

                  {/* Result Verdict */}
                  {matchResult === "MATCH" && (
                    <div className="p-3 bg-[#E6F4EA] border border-[#A8DAB5] rounded-lg text-xs text-[#00843D] flex items-start gap-2">
                      <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Exact Match Confirmed!</p>
                        <p className="text-[11px] mt-0.5">
                          This file is 100% byte-identical to the authentic PDF registered
                          by the chapter.
                        </p>
                      </div>
                    </div>
                  )}

                  {matchResult === "MISMATCH" && (
                    <div className="p-3 bg-[#FCE8E6] border border-[#F5C2BE] rounded-lg text-xs text-[#BA0C2F] flex items-start gap-2">
                      <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Cryptographic Hash Mismatch!</p>
                        <p className="text-[11px] mt-0.5">
                          The file fingerprint differs from the record stored on the server.
                          The PDF may have been edited, compressed, or generated separately.
                        </p>
                      </div>
                    </div>
                  )}

                  {matchResult === "NO_REFERENCE" && (
                    <div className="p-3 bg-[#FEF3D6] border border-[#FAD79A] rounded-lg text-xs text-[#E87722] flex items-start gap-2">
                      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Hash Computed (No Baseline Stored)</p>
                        <p className="text-[11px] mt-0.5">
                          This certificate record does not have a baseline hash uploaded.
                          Please verify via the QR code and recipient details.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-100 px-6 py-3 flex justify-end gap-2 border-t border-gray-200">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
