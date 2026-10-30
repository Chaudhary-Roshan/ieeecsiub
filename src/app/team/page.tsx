"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { TeamMember } from "@/types";
import { Users, Calendar, Award } from "lucide-react";
import clsx from "clsx";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("2026-2027");

  useEffect(() => {
    async function loadTeam() {
      const data = await db.fetchTeamMembers();
      setTeam(data);
      const activeYears = Array.from(new Set(data.map((m) => m.committeeYear))).sort().reverse();
      if (activeYears.length > 0 && !activeYears.includes(selectedYear)) {
        setSelectedYear(activeYears[0]);
      }
      setLoading(false);
    }
    loadTeam();
  }, []);

  const years = Array.from(new Set(team.map((m) => m.committeeYear))).sort().reverse();
  const currentMembers = team.filter((m) => m.committeeYear === selectedYear);

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

        {/* Tenure Selection Tabs */}
        {years.length > 1 && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={clsx(
                  "px-5 py-2 rounded-full text-xs font-montserrat font-semibold transition-all",
                  selectedYear === year
                    ? "bg-ieee-navy text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                Tenure {year} {year === "2026-2027" && "(Current)"}
              </button>
            ))}
          </div>
        )}

        {/* Team Grid */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-montserrat font-medium">Loading leadership roster...</p>
          </div>
        ) : currentMembers.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-card border border-dashed border-gray-300 space-y-3">
            <Users className="mx-auto text-gray-400" size={40} />
            <h3 className="font-montserrat font-bold text-gray-800 text-base">No Officers Listed for {selectedYear}</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Officer tenure records for this term will be populated upon official IEEE vTools Officer Reporting confirmation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white border border-ieee-border rounded-card overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div>
                  <div className="h-56 w-full overflow-hidden relative bg-gradient-to-br from-ieee-navy via-[#003B73] to-ieee-blue flex items-center justify-center">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center text-white space-y-2 p-4">
                        <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-ieee-orange mx-auto flex items-center justify-center font-montserrat font-extrabold text-2xl text-white shadow-inner">
                          {member.name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="text-[10px] font-montserrat font-bold tracking-widest text-ieee-cyan uppercase">
                          IEEE CS Officer
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-ieee-navy/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                      {member.committeeYear}
                    </div>
                  </div>

                  <div className="p-6 space-y-2">
                    <span className="text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider block">
                      {member.position}
                    </span>
                    <h3 className="text-xl font-montserrat font-extrabold text-ieee-navy">
                      {member.name}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed pt-1">
                      {member.approvedBio}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-gray-100 mt-2 text-[11px] text-gray-400">
                  Official tenure logged in IEEE vTools Officer Reporting
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
