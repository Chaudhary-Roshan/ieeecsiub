import React from "react";
import Link from "next/link";
import { ChapterLogo } from "./ChapterLogo";
import { CHAPTER_INFO } from "@/lib/constants";
import {
  Mail,
  MapPin,
  ExternalLink,
  Lock,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ieee-navy text-white font-openSans text-sm pt-14 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Chapter Brand & Two Official Campus Addresses */}
          <div className="space-y-4">
            <ChapterLogo theme="dark" />
            <p className="text-gray-300 text-xs leading-relaxed mt-4">
              Official Student Branch Chapter under the IEEE UCET-IUB Student
              Branch, Bahawalpur Subsection, Lahore Section, Region 10
              (Asia-Pacific). Dedicated to advancing technological innovation and
              excellence in computing.
            </p>

            <div className="pt-2 text-xs text-gray-300 space-y-2.5">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-ieee-cyan flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Address 1:</strong> Room No. 1.25, Department of Information &amp; Communication Engineering, Old Engineering Building, UCET, The Islamia University of Bahawalpur, Punjab, Pakistan.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-ieee-cyan flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Address 2:</strong> Room No. 105, Faculty of Engineering, IUB, Baghdad-ul-Jadeed Campus, Bahawalpur, Punjab, Pakistan.
                </span>
              </div>
            </div>

            {/* Quick Social & WhatsApp Icons */}
            <div className="flex items-center gap-3 pt-2 text-gray-300">
              <a
                href={CHAPTER_INFO.socials.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors"
                title="Join WhatsApp Community"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.769.814 2.801.815 3.179 0 5.766-2.587 5.768-5.766 0-3.18-2.587-5.768-5.773-5.768zm3.364 8.163c-.143.402-.711.737-1.155.834-.306.067-.704.122-2.049-.434-1.722-.712-2.834-2.459-2.92-2.572-.086-.114-.697-.927-.697-1.768 0-.841.442-1.255.6-.1426.157-.171.343-.214.457-.214.114 0 .228.001.328.006.105.005.245-.04.383.292.143.344.486 1.187.529 1.273.043.086.071.186.014.3-.057.114-.086.186-.171.286-.086.1-.181.223-.258.3-.086.086-.176.18-.076.352.1.171.444.733.953 1.186.656.584 1.209.765 1.38.851.171.086.271.071.371-.043.1-.114.428-.499.542-.671.114-.171.229-.143.386-.086.157.057 1.001.472 1.172.558.171.086.286.129.329.2.043.072.043.415-.1.817z" />
                  <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.462 3.488 1.338 5.008l-1.346 4.996 5.129-1.345c1.472.805 3.131 1.237 4.875 1.237 5.518 0 9.996-4.478 9.996-9.996 0-5.518-4.478-9.996-9.996-9.996zm0 18.232c-1.547 0-3.06-.415-4.385-1.2l-.315-.187-3.045.799.812-2.969-.205-.327c-.859-1.368-1.313-2.956-1.313-4.593 0-4.664 3.794-8.458 8.458-8.458 4.664 0 8.458 3.794 8.458 8.458 0 4.664-3.794 8.458-8.458 8.458z" />
                </svg>
              </a>
              <a
                href={CHAPTER_INFO.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0A66C2] hover:text-white flex items-center justify-center transition-colors"
                title="LinkedIn"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href={CHAPTER_INFO.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E1306C] hover:text-white flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href={CHAPTER_INFO.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877F2] hover:text-white flex items-center justify-center transition-colors"
                title="Facebook"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.456 5 15.584 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z" />
                </svg>
              </a>
              <a
                href={CHAPTER_INFO.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-gray-800 hover:text-white flex items-center justify-center transition-colors"
                title="GitHub"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: IEEE Official Links & Hierarchy */}
          <div>
            <h4 className="font-montserrat font-bold text-white uppercase tracking-wider text-xs mb-4 text-ieee-cyan">
              IEEE Organization
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
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
                  href="https://ieeebahawalpurssection.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ieee-orange transition-colors flex items-center justify-between font-semibold text-white"
                >
                  IEEE Bahawalpur Section <ExternalLink size={12} className="text-ieee-cyan" />
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

          {/* Column 3: Verification & Official Desk */}
          <div>
            <h4 className="font-montserrat font-bold text-white uppercase tracking-wider text-xs mb-4 text-ieee-cyan">
              Certificate &amp; Official Desk
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              For verification queries, name spelling rectifications, or executive chapter inquiries, contact our designated communications desk:
            </p>
            <a
              href={`mailto:${CHAPTER_INFO.contacts.verify}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-ieee-orange hover:underline break-all bg-black/30 px-3 py-2 rounded-lg border border-white/10"
            >
              <Mail size={14} />
              {CHAPTER_INFO.contacts.verify}
            </a>
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
