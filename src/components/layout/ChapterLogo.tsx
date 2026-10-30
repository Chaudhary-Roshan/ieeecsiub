"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

interface ChapterLogoProps {
  theme?: "light" | "dark"; // 'light' for white/light bg, 'dark' for navy/blue bg
  className?: string;
  condensed?: boolean;
  standaloneLogoOnly?: boolean;
}

export const ChapterLogo: React.FC<ChapterLogoProps> = ({
  theme = "light",
  className,
  condensed = false,
  standaloneLogoOnly = false,
}) => {
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/ieee-cs-logo-white.png" : "/ieee-cs-logo.png";

  return (
    <Link
      href="/"
      className={clsx(
        "flex items-center gap-2.5 sm:gap-3 group select-none transition-opacity hover:opacity-95",
        className
      )}
    >
      {/* Official IEEE Computer Society Primary Logo */}
      <div className="flex-shrink-0 flex items-center">
        <Image
          src={logoSrc}
          alt="IEEE Computer Society"
          width={condensed ? 140 : 160}
          height={condensed ? 43 : 49}
          priority
          className={clsx(
            "w-auto object-contain transition-transform group-hover:scale-[1.02]",
            condensed ? "h-8 sm:h-9" : "h-9 sm:h-10 md:h-11"
          )}
        />
      </div>

      {/* Chapter Sub-Brand Identifier Lockup */}
      {!standaloneLogoOnly && (
        <div
          className={clsx(
            "flex flex-col justify-center border-l pl-2.5 sm:pl-3",
            isDark ? "border-white/25" : "border-gray-300"
          )}
        >
          <span
            className={clsx(
              "font-montserrat font-extrabold text-[11px] sm:text-xs tracking-tight uppercase leading-snug",
              isDark ? "text-white" : "text-ieee-navy"
            )}
          >
            UCET – IUB
          </span>
          <span
            className={clsx(
              "block font-montserrat font-bold text-[9px] sm:text-[10px] tracking-tight uppercase leading-none mt-0.5",
              isDark ? "text-ieee-cyan" : "text-ieee-blue"
            )}
          >
            Student Branch Chapter
          </span>
          {!condensed && (
            <span
              className={clsx(
                "hidden sm:block font-openSans text-[8.5px] tracking-normal leading-tight mt-0.5",
                isDark ? "text-gray-300" : "text-ieee-muted"
              )}
            >
              Lahore Section • Region 10
            </span>
          )}
        </div>
      )}
    </Link>
  );
};
