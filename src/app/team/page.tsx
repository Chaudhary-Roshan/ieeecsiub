"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { TeamMember } from "@/types";
import { Users, Calendar, Award } from "lucide-react";
import clsx from "clsx";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("2026-2027");

  useEffect(() => {
    setTeam(db.getTeamMembers());
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
        <div className="flex items-center justify-center gap-3">
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

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-ieee-border rounded-card overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
            >
              <div>
                <div className="h-60 w-full overflow-hidden relative bg-gray-200">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
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
      </div>
    </div>
  );
}
