"use client";

import React, { useState } from "react";
import { TeamMember } from "@/types";
import { Users, Calendar, Award } from "lucide-react";
import clsx from "clsx";

interface TeamListClientProps {
  initialMembers: TeamMember[];
}

export const TeamListClient: React.FC<TeamListClientProps> = ({ initialMembers }) => {
  const years = Array.from(new Set(initialMembers.map((m) => m.committeeYear))).sort().reverse();
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || "2026-2027");

  const currentMembers = initialMembers.filter((m) => m.committeeYear === selectedYear);

  return (
    <div className="space-y-12">
      {/* Tenure Selection Tabs */}
      {years.length > 1 && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={clsx(
                "px-5 py-2.5 rounded-full text-xs font-montserrat font-bold transition-all shadow-sm flex items-center gap-2",
                selectedYear === year
                  ? "bg-ieee-navy text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              )}
            >
              <Calendar size={14} className={selectedYear === year ? "text-ieee-orange" : "text-gray-400"} />
              <span>Tenure {year}</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {currentMembers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-card p-12 text-center text-gray-500 text-sm">
          No team records found for this committee year.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo */}
                <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={member.photoUrl || "/team/placeholder.png"}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-ieee-navy shadow-sm flex items-center gap-1">
                    <Award size={12} className="text-ieee-orange" />
                    <span>{member.committeeYear}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-2.5">
                  <h3 className="font-montserrat font-bold text-xl text-ieee-navy">
                    {member.name}
                  </h3>
                  <div className="text-xs font-bold text-ieee-blue uppercase tracking-wider">
                    {member.position}
                  </div>
                  {member.approvedBio && (
                    <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed pt-1">
                      {member.approvedBio}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              {(member.email || member.linkedinUrl) && (
                <div className="p-6 pt-0 border-t border-gray-100 flex items-center gap-4 text-xs">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-gray-500 hover:text-ieee-blue transition-colors font-medium"
                    >
                      {member.email}
                    </a>
                  )}
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ieee-blue hover:underline font-bold ml-auto"
                    >
                      LinkedIn &rarr;
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

