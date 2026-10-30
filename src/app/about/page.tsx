import React from "react";
import Link from "next/link";
import { ChapterLogo } from "@/components/layout/ChapterLogo";
import { Button } from "@/components/ui/Button";
import { CHAPTER_INFO } from "@/lib/constants";
import {
  ShieldCheck,
  Building2,
  ExternalLink,
  Target,
  Sparkles,
  Award,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex-1 bg-white py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Title Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-ieee-surfaceTint text-ieee-navy text-xs font-montserrat font-bold px-3.5 py-1.5 rounded-full">
            <Building2 size={15} />
            Institutional Affiliation & Organization
          </div>

          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            About IEEE Computer Society UCET-IUB
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The premier computing professional student entity at University College of
            Engineering & Technology, The Islamia University of Bahawalpur.
          </p>
        </div>

        {/* Purpose & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
              Our Charter & Mission
            </span>
            <h2 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
              Advancing Technology for Humanity
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Chartered under the IEEE UCET-IUB Student Branch and IEEE Lahore Section, the
              chapter serves as an innovation crucible for computing and engineering
              students in Southern Punjab.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              We bridge academic classroom curricula with real-world engineering standards:
              hands-on development, rigorous open-source contribution, cryptographic
              credential verification, and technical conference publication.
            </p>
            <div className="pt-2">
              <Button href="/membership" variant="primary">
                Join Our Chapter Activities
              </Button>
            </div>
          </div>

          <div className="bg-ieee-navy p-8 rounded-card text-white space-y-6 shadow-lg">
            <ChapterLogo theme="dark" />
            <div className="border-t border-white/20 pt-4 space-y-3 text-xs text-gray-200">
              <p>
                <strong>Academic Unit:</strong> University College of Engineering &
                Technology (UCET)
              </p>
              <p>
                <strong>University:</strong> The Islamia University of Bahawalpur (IUB)
              </p>
              <p>
                <strong>Parent Student Branch:</strong>{" "}
                <a
                  href={CHAPTER_INFO.parentBranchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ieee-cyan underline inline-flex items-center gap-1"
                >
                  edu.ieee.org/pk-ucetiub <ExternalLink size={11} />
                </a>
              </p>
              <p>
                <strong>Governance Section:</strong> IEEE Lahore Section (Region 10)
              </p>
            </div>
          </div>
        </div>

        {/* IEEE Organizational Hierarchy */}
        <div className="bg-gray-50 border border-ieee-border rounded-card p-8 md:p-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
              Institutional Structure
            </span>
            <h3 className="text-2xl font-montserrat font-extrabold text-ieee-navy">
              Official IEEE Hierarchical Connection
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Our chapter operates within the formal governance structure of the world&apos;s
              largest technical professional organization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CHAPTER_INFO.hierarchy.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-5 text-center flex flex-col justify-between shadow-sm"
              >
                <div>
                  <span className="text-[10px] font-bold text-ieee-orange uppercase tracking-wider block mb-1">
                    Step {idx + 1}
                  </span>
                  <h4 className="font-montserrat font-bold text-sm text-ieee-navy">
                    {item.name}
                  </h4>
                </div>
                <span className="mt-3 text-[11px] text-gray-500 bg-gray-100 py-1 px-2 rounded-full inline-block">
                  {item.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Connection to IEEE Computer Society */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-montserrat font-extrabold text-ieee-navy">
              What is IEEE Computer Society?
            </h3>
            <p className="text-sm text-gray-600">
              IEEE Computer Society (IEEE CS) is the premier source for information,
              inspiration, and collaboration in computer science and engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-700">
            <div className="p-6 bg-white border border-ieee-border rounded-card space-y-2.5">
              <Sparkles className="text-ieee-blue" size={24} />
              <h4 className="font-montserrat font-bold text-sm text-ieee-navy">
                Global Technical Standards
              </h4>
              <p className="leading-relaxed">
                IEEE CS shapes core international computing standards, from IEEE 802
                networking to modern software engineering best practices.
              </p>
            </div>

            <div className="p-6 bg-white border border-ieee-border rounded-card space-y-2.5">
              <Award className="text-ieee-orange" size={24} />
              <h4 className="font-montserrat font-bold text-sm text-ieee-navy">
                Digital Library & Research
              </h4>
              <p className="leading-relaxed">
                Connects student scholars with IEEE Xplore, featuring hundreds of thousands
                of peer-reviewed papers, transactions, and magazines.
              </p>
            </div>

            <div className="p-6 bg-white border border-ieee-border rounded-card space-y-2.5">
              <Target className="text-status-active" size={24} />
              <h4 className="font-montserrat font-bold text-sm text-ieee-navy">
                Local Chapter Empowerment
              </h4>
              <p className="leading-relaxed">
                Our UCET-IUB chapter translates global society resources into accessible,
                on-campus workshops, code sprints, and community support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
