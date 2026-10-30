import React from "react";
import Link from "next/link";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  href?: string;
  external?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  href,
  external,
  children,
  className,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-montserrat font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const sizeStyles = {
    sm: "px-4 py-1.5 text-xs tracking-wide",
    md: "px-6 py-2.5 text-sm tracking-wide",
    lg: "px-8 py-3.5 text-base tracking-wider",
  };

  const variantStyles = {
    // Primary: IEEE Blue (#00629B) with White text (6.5:1 contrast)
    primary:
      "bg-ieee-blue text-white hover:bg-ieee-navy focus:ring-ieee-blue shadow-sm hover:shadow",
    // Accent: CS Orange (#FFA300) with Black text ONLY (10.5:1 contrast, never white)
    accent:
      "bg-ieee-orange text-black hover:bg-[#e69300] focus:ring-ieee-orange shadow-sm font-bold",
    // Secondary: Soft surface tint (#CCE0EB) with Navy text
    secondary:
      "bg-ieee-surfaceTint text-ieee-navy hover:bg-[#b8d4e4] focus:ring-ieee-navy",
    // Outline: Transparent with IEEE Blue border
    outline:
      "border-2 border-ieee-blue text-ieee-blue hover:bg-ieee-blue hover:text-white focus:ring-ieee-blue",
    // Danger: Revocation / Rejection Red
    danger:
      "bg-status-revoked text-white hover:bg-[#990a26] focus:ring-status-revoked",
  };

  const combinedClasses = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};
