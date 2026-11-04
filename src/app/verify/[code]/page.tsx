"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CertificateRecord } from "@/types";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { Button } from "@/components/ui/Button";
import { CHAPTER_INFO } from "@/lib/constants";
import { normalizeVerificationCode } from "@/lib/codeGenerator";
import {
  ShieldCheck,
  Search,
  ArrowLeft,
  HelpCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function CertificateVerificationResultPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code ? decodeURIComponent(params.code as string) : "";
  const normalizedCode = normalizeVerificationCode(rawCode);

  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [status, setStatus] = useState<"LOADING" | "FOUND" | "NOT_FOUND" | "ERROR">("LOADING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(normalizedCode || rawCode);

  const executeLookup = (code: string) => {
    if (!code) return;
    setStatus("LOADING");
    setErrorMessage(null);
    let active = true;

    db.fetchCertificateWithStatus(code).then((result) => {
      if (!active) return;
      if (result.status === "FOUND" && result.certificate) {
        setCert(result.certificate);
        setStatus("FOUND");
      } else if (result.status === "ERROR") {
        setCert(null);
        setErrorMessage(result.error || "Database connectivity issue");
        setStatus("ERROR");
      } else {
        setCert(null);
        setStatus("NOT_FOUND");
      }
    });

    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return executeLookup(rawCode);
  }, [rawCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const clean = normalizeVerificationCode(searchInput);
      router.push(`/verify/${encodeURIComponent(clean || searchInput.trim().toUpperCase())}`);
    }
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
        {status === "LOADING" ? (
          <div className="bg-white border border-ieee-border rounded-card p-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600 font-montserrat font-medium">
              Querying chapter certificate registry...
            </p>
          </div>
        ) : status === "FOUND" && cert ? (
          /* Match Found: Detailed Certificate Card */
          <div className="space-y-6">
            <CertificateCard
              certificate={cert}
            />
          </div>
        ) : status === "ERROR" ? (
          /* Database or Network Failure (Requirement 5) */
          <div className="bg-white border border-amber-200 rounded-card p-8 md:p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-montserrat font-extrabold text-ieee-navy">
                Verification Temporarily Unavailable
              </h2>
              <p className="text-sm font-mono text-gray-500 uppercase">
                Queried Identifier: <span className="font-bold text-gray-700">{normalizedCode || rawCode}</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed pt-2">
                The chapter certificate registry is currently experiencing a database connectivity interruption
                or service delay. Your verification request could not be completed at this moment.
              </p>
              {errorMessage && (
                <div className="inline-block mt-2">
                  <span className="text-[11px] font-mono text-amber-800 bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-md">
                    Registry Service Notice: {errorMessage}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => executeLookup(rawCode)} variant="primary" size="md">
                <RefreshCw size={15} className="mr-2" /> Retry Verification
              </Button>
              <Button href="/verify" variant="outline" size="md">
                Search Another Identifier
              </Button>
            </div>
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
                Queried Identifier: <span className="font-bold text-gray-700">{normalizedCode || rawCode}</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed pt-2">
                This verification code or identifier does not match any currently published active,
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
    </div>
  );
}
