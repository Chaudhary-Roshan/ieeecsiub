import React from "react";
import { getTeamMembers } from "@/lib/data/team";
import { TeamListClient } from "@/components/team/TeamListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Always serve fresh data synchronized with Postgres

export const metadata = {
  title: "Officers & Faculty Advisors | IEEE CS UCET-IUB",
  description: "Official appointed chapter leadership, faculty advisors, and executive committee members.",
};

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Executive Leadership & Advisory
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Our Officers & Faculty Advisors
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Dedicated faculty mentors and student executive committee leaders driving
            chapter excellence under official appointment.
          </p>
        </div>

        {/* Client-side year tab filtering */}
        <TeamListClient initialMembers={members} />
      </div>
    </div>
  );
}
