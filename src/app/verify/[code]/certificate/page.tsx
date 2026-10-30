"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CertificateRecord } from "@/types";
import { renderCertificateHtml } from "@/lib/certificateHtmlRenderer";
import { Printer, ArrowLeft, ShieldCheck, Download, AlertCircle, Share2, Check } from "lucide-react";

export default function StandaloneCertificateViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawCode = params?.code ? decodeURIComponent(params.code as string) : "";
  const autoPrint = searchParams.get("print") === "true";

  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!rawCode) return;
    let active = true;

    db.fetchCertificateByCode(rawCode).then(async (found) => {
      if (!active) return;
      if (found) {
        setCert(found);
        try {
          const html = await renderCertificateHtml(found);
          if (active) setRenderedHtml(html);
        } catch (err) {
          console.error("Failed to render certificate HTML:", err);
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [rawCode]);

  useEffect(() => {
    if (!loading && renderedHtml && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [loading, renderedHtml, autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-[#00629B] border-t-transparent rounded-full animate-spin" />
        <p className="font-montserrat font-semibold text-gray-700 text-sm">
          Rendering high-resolution official certificate...
        </p>
      </div>
    );
  }

  if (!cert || !renderedHtml) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900">Certificate Not Found</h1>
        <p className="text-sm text-gray-600 max-w-md">
          Could not find an issued certificate matching identifier <span className="font-mono font-bold text-gray-800">{rawCode}</span>.
        </p>
        <div className="pt-2">
          <Link
            href="/verify"
            className="px-4 py-2 bg-[#002855] text-white text-xs font-semibold rounded-lg hover:bg-[#00629B] transition-colors"
          >
            Go to Verification Registry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9ECEF] flex flex-col items-center">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="no-print w-full sticky top-0 z-50 bg-[#002855] text-white px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 border-b border-[#001c3d]">
        <div className="flex items-center gap-3">
          <Link
            href={`/verify/${cert.code}`}
            className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-gray-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft size={14} /> Back to Details
          </Link>
          <div className="hidden sm:flex items-center gap-2 border-l border-white/20 pl-3">
            <ShieldCheck size={16} className="text-[#FFA300]" />
            <span className="text-xs font-bold tracking-wide">
              {cert.recipientName} • <span className="font-mono text-gray-300">{cert.code}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors"
            title="Copy certificate link"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{copied ? "Copied Link!" : "Share Link"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-montserrat font-bold px-4 py-1.5 rounded-lg bg-[#FFA300] hover:bg-orange-500 text-gray-950 transition-all shadow-md active:scale-95"
          >
            <Printer size={15} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Embedded High-Fidelity Printable Canvas */}
      <div className="print-container w-full max-w-[1150px] p-2 sm:p-6 flex flex-col items-center justify-center">
        <div
          className="certificate-shadow-wrap bg-white shadow-2xl rounded-none overflow-hidden my-auto"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>

      {/* Print Specific CSS Overrides */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            width: 100% !important;
            height: 100% !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          .certificate-shadow-wrap {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .cert {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
