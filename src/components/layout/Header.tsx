"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChapterLogo } from "./ChapterLogo";
import { Button } from "../ui/Button";
import { ShieldCheck, Menu, X, ExternalLink } from "lucide-react";
import clsx from "clsx";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Team", href: "/team" },
    { label: "Events", href: "/events" },
    { label: "Membership", href: "/membership" },
    { label: "Verify", href: "/verify" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="w-full bg-white border-b border-ieee-border sticky top-0 z-50">
      {/* 1. Thin Utility Bar */}
      <div className="bg-ieee-navy text-white text-[11px] font-openSans py-1.5 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-gray-300">
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
              IEEE Computer Society <ExternalLink size={10} />
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
              className="text-white hover:text-ieee-orange font-montserrat font-semibold flex items-center gap-1 transition-colors"
            >
              <ShieldCheck size={13} className="text-ieee-cyan" />
              Verify Certificate
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
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

        {/* Action: Accent CS Orange Pill Button ("Join the chapter") */}
        <div className="hidden lg:flex items-center gap-3">
          <Button href="/membership" variant="accent" size="sm">
            Join the chapter
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            className="p-2 text-ieee-navy hover:text-ieee-blue focus:outline-none"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-ieee-border px-6 py-4 space-y-3 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={clsx(
                "block font-montserrat text-sm font-semibold py-2",
                pathname === link.href ? "text-ieee-blue" : "text-gray-700"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-ieee-border">
            <Button
              href="/membership"
              variant="accent"
              size="md"
              className="w-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join the chapter
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
