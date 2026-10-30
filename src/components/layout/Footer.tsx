import React from "react";
import Link from "next/link";
import { ChapterLogo } from "./ChapterLogo";
import { CHAPTER_INFO } from "@/lib/constants";
import {
  ShieldCheck,
  Mail,
  MapPin,
  ExternalLink,
  Lock,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ieee-navy text-white font-openSans text-sm pt-14 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Chapter Brand & Affiliation */}
          <div className="space-y-4">
            <ChapterLogo theme="dark" />
            <p className="text-gray-300 text-xs leading-relaxed mt-4">
              Official Student Branch Chapter under the IEEE UCET-IUB Student
              Branch, Bahawalpur Subsection, Lahore Section, Region 10
              (Asia-Pacific). Dedicated to advancing technological innovation and
              excellence in computing.
            </p>
            <div className="pt-2 text-xs text-gray-400">
              <p className="flex items-start gap-2">
                <MapPin size={14} className="text-ieee-cyan flex-shrink-0 mt-0.5" />
                <span>
                  Department of Computer Science & Engineering, UCET,
                  Baghdad-ul-Jadeed Campus, Bahawalpur, Pakistan.
                </span>
              </p>
            </div>
          </div>

          {/* Column 2: IEEE Official Links & Hierarchy */}
          <div>
            <h4 className="font-montserrat font-bold text-white uppercase tracking-wider text-xs mb-4 text-ieee-cyan">
              IEEE Organization
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <a
                  href="https://www.ieee.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ieee-orange transition-colors flex items-center justify-between"
                >
                  IEEE Global <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.computer.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ieee-orange transition-colors flex items-center justify-between"
                >
                  IEEE Computer Society <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://edu.ieee.org/pk-ucetiub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ieee-orange transition-colors flex items-center justify-between"
                >
                  Parent Student Branch (edu.ieee.org) <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://site.ieee.org/lahore/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ieee-orange transition-colors flex items-center justify-between"
                >
                  IEEE Lahore Section <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://events.vtools.ieee.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ieee-orange transition-colors flex items-center justify-between"
                >
                  IEEE vTools Portal <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links & Transparency */}
          <div>
            <h4 className="font-montserrat font-bold text-white uppercase tracking-wider text-xs mb-4 text-ieee-cyan">
              Quick Links & Policy
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <Link
                  href="/verify"
                  className="hover:text-ieee-orange transition-colors flex items-center gap-1.5 font-semibold text-white"
                >
                  <ShieldCheck size={14} className="text-ieee-cyan" />
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-ieee-orange transition-colors">
                  About Chapter & History
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-ieee-orange transition-colors">
                  All Events & Reports
                </Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-ieee-orange transition-colors">
                  Leadership & Advisors
                </Link>
              </li>
              <li>
                <Link href="/membership" className="hover:text-ieee-orange transition-colors">
                  Membership Options
                </Link>
              </li>
              <li>
                <Link href="/policy" className="hover:text-ieee-orange transition-colors">
                  Certificate Policy & Ethics
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ieee-orange transition-colors">
                  Data Privacy (GDPR-aligned)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Verification Contact & Notice */}
          <div>
            <h4 className="font-montserrat font-bold text-white uppercase tracking-wider text-xs mb-4 text-ieee-cyan">
              Certificate Queries
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              For verification disputes, historical records lookup, or spelling
              rectifications, write to the chapter&apos;s designated verification desk:
            </p>
            <a
              href={`mailto:${CHAPTER_INFO.contacts.verify}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-ieee-orange hover:underline break-all bg-black/30 px-3 py-2 rounded-lg border border-white/10"
            >
              <Mail size={14} />
              {CHAPTER_INFO.contacts.verify}
            </a>

            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 text-[11px] text-gray-300">
              <span className="font-bold text-white block mb-1">
                Official Credential Notice:
              </span>
              Chapter certificates indicate participation and merit; formal CEU / PDH
              credentials are provided exclusively by the IEEE Credentialing Program.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} IEEE Computer Society Student Branch Chapter,
            UCET-IUB. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <Lock size={12} />
              Staff Login (2FA)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
