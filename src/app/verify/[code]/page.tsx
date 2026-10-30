"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CertificateRecord } from "@/types";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { PdfVerifyModal } from "@/components/certificates/PdfVerifyModal";
import { generateCertificatePdf } from "@/lib/certificatePdf";
import { Button } from "@/components/ui/Button";
import { CHAPTER_INFO } from "@/lib/constants";
import {
  ShieldCheck,
  Search,
  ArrowLeft,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

export default function CertificateVerificationResultPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code ? decodeURIComponent(params.code as string) : "";

  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(rawCode);

  useEffect(() => {
    if (!rawCode) return;
    setLoading(true);
    let active = true;

    // Look up certificate in Supabase (with fallback to local storage)
    db.fetchCertificateByCode(rawCode).then((found) => {
      if (active) {
        setCert(found || null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [rawCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/verify/${searchInput.trim().toUpperCase()}`);
    }
  };

  const handleDownloadPdf = async () => {
    if (!cert) return;
    window.open(`/verify/${cert.code}/certificate?print=true`, "_blank");
  };

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Search Back */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/verify"
            className="inline-flex items-center text-xs font-montserrat font-semibold text-ieee-blue hover:text-ieee-navy transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5" /> Back to Verification Search
          </Link>

          {/* Quick search bar for another code */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search another code..."
              className="text-xs font-mono uppercase px-3 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-ieee-blue w-48 sm:w-60"
            />
            <button
              type="submit"
              className="bg-ieee-navy text-white text-xs font-montserrat font-semibold px-3 py-1.5 rounded-full hover:bg-ieee-blue transition-colors flex items-center gap-1"
            >
              <Search size={12} />
              Check
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white border border-ieee-border rounded-card p-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600 font-montserrat font-medium">
              Querying chapter certificate registry...
            </p>
          </div>
        ) : cert ? (
          /* Match Found: Detailed Certificate Card */
          <div className="space-y-6">
            <CertificateCard
              certificate={cert}
              onOpenPdfVerifier={() => setPdfModalOpen(true)}
              onDownloadPdf={handleDownloadPdf}
            />
          </div>
        ) : (
          /* Unknown Code: Strict wording per specification */
          <div className="bg-white border border-ieee-border rounded-card p-8 md:p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-[#F1F3F4] text-[#75787B] rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-montserrat font-extrabold text-ieee-navy">
                No matching record found
              </h2>
              <p className="text-sm font-mono text-gray-500 uppercase">
                Queried Code: <span className="font-bold text-gray-700">{rawCode}</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed pt-2">
                This verification code does not match any currently published active,
                replaced, or archived record in the chapter registry.
              </p>
            </div>

            {/* Crucial Note per Spec: Do not call fake, some old certificates need manual checking */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 max-w-lg mx-auto text-left flex items-start gap-3">
              <HelpCircle size={18} className="text-ieee-blue flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-gray-800">
                  Note on Historical or Unregistered Certificates:
                </p>
                <p className="leading-relaxed">
                  Some legacy certificates issued prior to the automated registry or partner
                  workshops might require manual verification against physical archives.
                </p>
                <p className="pt-1">
                  If you hold an official printed certificate with this identifier, please contact{" "}
                  <a
                    href={`mailto:${CHAPTER_INFO.contacts.verify}?subject=Manual%20Verification%20Request%20${rawCode}`}
                    className="text-ieee-blue font-semibold underline"
                  >
                    {CHAPTER_INFO.contacts.verify}
                  </a>{" "}
                  with a scan of your document.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button href="/verify" variant="outline" size="sm">
                Try Another Code
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* PDF Verification Modal */}
      {cert && (
        <PdfVerifyModal
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
          targetCertificateCode={cert.code}
          expectedSha256={cert.sha256Fingerprint}
        />
      )}
    </div>
  );
}
