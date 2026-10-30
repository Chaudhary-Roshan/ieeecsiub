import React from "react";
import Link from "next/link";
import clsx from "clsx";

interface ChapterLogoProps {
  theme?: "light" | "dark"; // 'light' for white/light bg, 'dark' for navy/blue bg
  className?: string;
  condensed?: boolean;
}

export const ChapterLogo: React.FC<ChapterLogoProps> = ({
  theme = "light",
  className,
  condensed = false,
}) => {
  const isDark = theme === "dark";

  return (
    <Link href="/" className={clsx("flex items-center gap-3 group select-none", className)}>
      {/* IEEE CS Brand Mark (1/0 circular emblem) */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <svg
          width="44"
          height="44"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform group-hover:scale-105"
        >
          {/* Outer circle with official IEEE CS Orange */}
          <circle cx="50" cy="50" r="46" stroke="#FFA300" strokeWidth="8" />
          {/* Inner 1 and 0 stylized digital geometry */}
          {/* Digit 1 */}
          <rect x="33" y="27" width="8" height="46" rx="2" fill={isDark ? "#FFFFFF" : "#002855"} />
          <path d="M26 36L34 27H40V33L26 36Z" fill={isDark ? "#FFFFFF" : "#002855"} />
          <rect x="25" y="70" width="24" height="6" rx="2" fill={isDark ? "#FFFFFF" : "#002855"} />
          {/* Digit 0 */}
          <rect
            x="53"
            y="27"
            width="22"
            height="46"
            rx="11"
            stroke={isDark ? "#FFFFFF" : "#002855"}
            strokeWidth="8"
          />
          {/* Trademark symbol */}
          <text
            x="78"
            y="30"
            fontSize="10"
            fontWeight="bold"
            fill={isDark ? "#FFFFFF" : "#002855"}
            fontFamily="Montserrat, sans-serif"
          >
            ™
          </text>
        </svg>
      </div>

      {/* Typography Lockup */}
      <div className="flex flex-col justify-center">
        {/* IEEE Master Brand & Computer Society Primary Name */}
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={clsx(
              "font-montserrat font-extrabold tracking-wider text-xs md:text-sm",
              isDark ? "text-white" : "text-ieee-navy"
            )}
          >
            IEEE <span className="text-ieee-orange font-black">COMPUTER SOCIETY</span>
          </span>
        </div>

        {/* Sub-Brand: Student Branch Chapter Details */}
        <div className="leading-tight mt-0.5">
          <span
            className={clsx(
              "block font-montserrat font-bold text-[10px] md:text-[11px] tracking-tight uppercase",
              isDark ? "text-[#CCE0EB]" : "text-ieee-blue"
            )}
          >
            UCET – The Islamia University of Bahawalpur
          </span>
          {!condensed && (
            <span
              className={clsx(
                "block font-openSans text-[9px] tracking-normal",
                isDark ? "text-gray-300" : "text-ieee-muted"
              )}
            >
              Student Branch Chapter • Lahore Section
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
