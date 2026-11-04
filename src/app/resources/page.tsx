import React from "react";
import Link from "next/link";
import { Download, FileCode, BookOpen, ExternalLink, ShieldCheck, Sparkles, FolderGit2 } from "lucide-react";
import { getEvents } from "@/lib/data/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Learning Resources & Toolkits | IEEE CS UCET-IUB",
  description: "Official workshop slides, repositories, and learning toolkits from IEEE CS UCET-IUB events.",
};

interface ResourceItem {
  title: string;
  event: string;
  type: string;
  link: string;
  isExternal?: boolean;
}

export default async function ResourcesPage() {
  const events = await getEvents();

  // Dynamic resources derived from database events
  const dynamicEventResources: ResourceItem[] = [];

  events.forEach((evt) => {
    if (evt.meetingLink) {
      dynamicEventResources.push({
        title: `${evt.title} – Session Portal / Recording`,
        event: evt.title,
        type: "Online Access Portal",
        link: evt.meetingLink,
        isExternal: true,
      });
    }
    if (evt.vtoolsLink) {
      dynamicEventResources.push({
        title: `${evt.title} – Official IEEE vTools Report`,
        event: evt.title,
        type: "Official IEEE Registry Archive",
        link: evt.vtoolsLink,
        isExternal: true,
      });
    }
  });

  const coreResources: ResourceItem[] = [
    {
      title: "IEEE DigitalFest 2026 – Project Expo Guidelines & Rubrics",
      event: "IEEE DigitalFest 2026 Projects Expo",
      type: "Technical Evaluation Guide (PDF)",
      link: "/events/ieee-digitalfest-2026-projects-expo",
      isExternal: false,
    },
    {
      title: "Agentic AI Architecture & LLM Engineering Slides",
      event: "Hands-on Modern AI Agent Development",
      type: "PDF Presentation (24 MB)",
      link: "#",
      isExternal: false,
    },
    {
      title: "Flutter & Supabase Starter Repository",
      event: "Hands-on Flutter & Cloud Mobile Development",
      type: "GitHub Code Template",
      link: "https://github.com/ieee-cs-ucet-iub",
      isExternal: true,
    },
    {
      title: "Packets & Protocols: Networking & Wireshark Workshop Kit",
      event: "Packets and Protocols Workshop",
      type: "Lab Guide & Packet Captures",
      link: "/events/packets-and-protocols-hands-on-networking-workshop",
      isExternal: false,
    },
    {
      title: "Git & GitHub Workflow Standards for Engineering Students",
      event: "Open Source Collaboration Workshop",
      type: "Reference Guide (PDF)",
      link: "#",
      isExternal: false,
    },
    {
      title: "IEEE Computer Society Official Brand Identity Guide",
      event: "Chapter Governance Assets",
      type: "Brand Guidelines (PDF)",
      link: "https://www.computer.org/about/ieee-computer-society-brand-guide",
      isExternal: true,
    },
  ];

  const allResources = [...dynamicEventResources, ...coreResources];

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8 font-openSans">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-ieee-blue text-xs font-montserrat font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-ieee-orange" />
            Live Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Workshop Slides, Repositories & Guides
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Download authorized lecture materials, starter repositories, and official
            IEEE documentation shared during chapter activities at UCET IUB.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allResources.map((res, i) => (
            <div
              key={i}
              className="bg-white border border-ieee-border rounded-card p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <span className="text-xs text-ieee-blue font-bold uppercase tracking-wider block">
                  {res.event}
                </span>
                <h2 className="font-montserrat font-bold text-base text-ieee-navy">
                  {res.title}
                </h2>
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
                    Open Resource on Web <ExternalLink size={13} />
                  </a>
                ) : (
                  <Link
                    href={res.link}
                    className="inline-flex items-center gap-1.5 text-xs font-montserrat font-bold text-ieee-blue hover:underline"
                  >
                    <Download size={13} /> View Resource
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
