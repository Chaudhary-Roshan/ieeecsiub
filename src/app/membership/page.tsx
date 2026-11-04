import React from "react";
import { MembershipClient } from "@/components/membership/MembershipClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Membership Options | IEEE CS UCET-IUB",
  description: "Join IEEE Computer Society student branch chapter at UCET IUB or become a global IEEE member.",
};

export default function MembershipPage() {
  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8 font-openSans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Participation &amp; Global Credentialing
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Chapter Membership Options
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We maintain total transparency: join our university chapter activities, or obtain international IEEE Computer Society professional membership.
          </p>
        </div>

        {/* Dynamic Client Form & International Portal */}
        <MembershipClient />
      </div>
    </div>
  );
}
