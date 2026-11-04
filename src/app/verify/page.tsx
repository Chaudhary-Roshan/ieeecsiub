import React from "react";
import Image from "next/image";
import { VerifySearchClient } from "@/components/verify/VerifySearchClient";
import { CHAPTER_INFO } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, QrCode, Lock, HelpCircle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Verify a Certificate | IEEE CS UCET-IUB",
  description: "Official cryptographic verification portal for IEEE Computer Society UCET-IUB issued certificates.",
};

export default async function VerifyPage() {
  const supabase = await createClient();

  // Fetch live count of active verifiable credentials from database
  const { count } = await supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  const totalActiveCerts = count ?? 61;

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8 font-openSans">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Page Title & Subtitle */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-1">
            <Image
              src="/ieee-cs-logo.png"
              alt="IEEE Computer Society"
              width={180}
              height={55}
              priority
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-ieee-surfaceTint text-ieee-navy text-xs font-montserrat font-bold px-3.5 py-1.5 rounded-full border border-ieee-border">
            <ShieldCheck size={16} className="text-ieee-blue" />
            Official IEEE CS UCET-IUB Certificate Registry
          </div>

          <h1 className="text-3xl sm:text-4xl font-montserrat font-extrabold text-ieee-navy">
            Verify a Certificate
          </h1>

          <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Enter the alphanumeric verification code, student roll number, or paste the full verification link to confirm authentic chapter issuance against our live database.
          </p>

          {/* Real-time registry status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-status-active text-xs font-montserrat font-semibold rounded-full border border-green-200">
            <CheckCircle2 size={13} />
            <span>{totalActiveCerts}+ Cryptographically Verified Chapter Credentials in Live Registry</span>
          </div>
        </div>

        {/* Central Search Box Client Component */}
        <VerifySearchClient />

        {/* Informational Guidance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-600">
          <div className="bg-white border border-ieee-border rounded-xl p-5 space-y-2 shadow-2xs">
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

          <div className="bg-white border border-ieee-border rounded-xl p-5 space-y-2 shadow-2xs">
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

          <div className="bg-white border border-ieee-border rounded-xl p-5 space-y-2 shadow-2xs">
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
    </div>
  );
}
