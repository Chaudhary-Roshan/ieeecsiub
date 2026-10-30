"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Download, FileCode, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

export default function ResourcesPage() {
  const resources = [
    {
      title: "Agentic AI Architecture Slide Deck",
      event: "Hands-on Modern AI Agent Development",
      type: "PDF Presentation (24 MB)",
      link: "#",
    },
    {
      title: "Flutter & Supabase Starter Repository",
      event: "Hands-on Flutter & Cloud Mobile Development",
      type: "GitHub Code Template",
      link: "https://github.com/ieee-cs-ucet-iub",
      isExternal: true,
    },
    {
      title: "Git & GitHub Cheatsheet for Students",
      event: "Open Source Collaboration Workshop",
      type: "Reference Guide (PDF)",
      link: "#",
    },
    {
      title: "IEEE Computer Society Brand Identity Guide",
      event: "Official Chapter Assets",
      type: "Brand Guidelines (PDF)",
      link: "https://www.computer.org/about/ieee-computer-society-brand-guide",
      isExternal: true,
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Open Knowledge & Toolkits
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Workshop Slides, Repositories & Guides
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Download authorized lecture materials, starter repositories, and official
            IEEE documentation shared during chapter activities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((res, i) => (
            <div
              key={i}
              className="bg-white border border-ieee-border rounded-card p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <span className="text-xs text-ieee-blue font-bold uppercase tracking-wider block">
                  {res.event}
                </span>
                <h3 className="font-montserrat font-bold text-base text-ieee-navy">
                  {res.title}
                </h3>
                <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                  {res.type}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                {res.isExternal ? (
                  <a
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-montserrat font-bold text-ieee-blue hover:underline"
                  >
                    Open Resource on GitHub / Web <ExternalLink size={13} />
                  </a>
                ) : (
                  <button
                    onClick={() => alert("Downloading resource archive...")}
                    className="inline-flex items-center gap-1.5 text-xs font-montserrat font-bold text-ieee-blue hover:underline"
                  >
                    <Download size={13} /> Download File
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
