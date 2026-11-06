"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChapterLogo } from "./ChapterLogo";
import { Button } from "../ui/Button";
import {
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Home,
  Info,
  Users,
  Calendar,
  Award,
  Mail,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "About", href: "/about", icon: Info },
    { label: "Team", href: "/team", icon: Users },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Membership", href: "/membership", icon: Award },
    { label: "Verify", href: "/verify", icon: ShieldCheck },
    { label: "Contact", href: "/contact", icon: Mail },
  ];

  return (
    <header className="w-full bg-white border-b border-ieee-border sticky top-0 z-40 shadow-2xs">
      {/* 1. Thin Utility Bar */}
      <div className="bg-ieee-navy text-white text-[11px] font-openSans py-1.5 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-4 text-gray-300 text-[10px] sm:text-[11px]">
            <a
              href="https://www.ieee.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              IEEE.org <ExternalLink size={10} />
            </a>
            <span className="text-gray-500">•</span>
            <a
              href="https://www.computer.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              IEEE CS <ExternalLink size={10} />
            </a>
            <span className="text-gray-500 hidden sm:inline">•</span>
            <a
              href="https://edu.ieee.org/pk-ucetiub"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors hidden sm:flex items-center gap-1 text-ieee-cyan font-medium"
            >
              Parent Student Branch (edu.ieee.org) <ExternalLink size={10} />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="text-white hover:text-ieee-orange font-montserrat font-semibold flex items-center gap-1 transition-colors text-[11px]"
            >
              <ShieldCheck size={13} className="text-ieee-cyan" />
              <span>Verify Certificate</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between">
        {/* Chapter Logo Lockup */}
        <ChapterLogo theme="light" />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "font-montserrat text-sm font-semibold transition-colors relative py-1",
                  isActive
                    ? "text-ieee-blue"
                    : "text-gray-700 hover:text-ieee-blue"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-ieee-orange rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Action: Accent CS Orange Pill Button ("Join the chapter") */}
        <div className="hidden lg:flex items-center gap-3">
          <Button href="/membership" variant="accent" size="sm" className="shadow-xs">
            Join the chapter
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            href="/verify"
            className="p-1.5 rounded-lg bg-sky-50 text-ieee-blue text-xs font-montserrat font-bold flex items-center gap-1 border border-sky-100"
            title="Verify Certificate"
          >
            <ShieldCheck size={15} className="text-ieee-cyan" />
            <span className="hidden xs:inline">Verify</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="p-2 rounded-lg text-ieee-navy hover:text-ieee-blue hover:bg-gray-100 focus:outline-none transition-colors"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* 3. Full Mobile Navigation Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <aside className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <ChapterLogo theme="light" condensed />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
                aria-label="Close navigation"
              >
                <X size={22} />
              </button>
            </div>

            {/* Drawer Body Links */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-1.5">
              <div className="text-[10px] font-montserrat font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
                Navigation
              </div>

              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-montserrat font-semibold transition-all",
                      isActive
                        ? "bg-ieee-surfaceTint/60 text-ieee-blue border-l-4 border-ieee-orange"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={isActive ? "text-ieee-blue" : "text-gray-400"}
                      />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400" />
                  </Link>
                );
              })}

              <div className="pt-4 pb-2">
                <Button
                  href="/membership"
                  variant="accent"
                  size="md"
                  className="w-full justify-center shadow-md font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Sparkles size={16} className="mr-1.5" />
                  Join the Chapter
                </Button>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="text-[10px] font-montserrat font-bold uppercase tracking-wider text-gray-400 px-3">
                  External IEEE Portals
                </div>
                <div className="space-y-1 text-xs text-gray-600 font-openSans px-3">
                  <a
                    href="https://www.ieee.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-1.5 hover:text-ieee-blue transition-colors"
                  >
                    <span>IEEE Global</span>
                    <ExternalLink size={12} />
                  </a>
                  <a
                    href="https://www.computer.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-1.5 hover:text-ieee-blue transition-colors"
                  >
                    <span>IEEE Computer Society</span>
                    <ExternalLink size={12} />
                  </a>
                  <a
                    href="https://edu.ieee.org/pk-ucetiub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-1.5 hover:text-ieee-blue transition-colors text-ieee-blue font-medium"
                  >
                    <span>Parent Student Branch</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-500 text-center">
              IEEE Computer Society SBC UCET-IUB
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
