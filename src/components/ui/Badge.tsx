import React from "react";
import clsx from "clsx";
import { CertificateStatus, EventStatus } from "@/types";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "active" | "revoked" | "replaced" | "notfound" | "cyan" | "default";
  status?: CertificateStatus | EventStatus;
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = "md",
  className,
}) => {
  // Determine variant based on status if provided
  let effectiveVariant = variant || "default";
  let label = children;

  if (status) {
    switch (status) {
      case "ACTIVE":
        effectiveVariant = "active";
        label = label || "Active Certificate";
        break;
      case "REVOKED":
        effectiveVariant = "revoked";
        label = label || "Revoked";
        break;
      case "REPLACED":
        effectiveVariant = "replaced";
        label = label || "Replaced";
        break;
      case "UPCOMING":
        effectiveVariant = "cyan";
        label = label || "Upcoming";
        break;
      case "ONGOING":
        effectiveVariant = "active";
        label = label || "Happening Now";
        break;
      case "COMPLETED":
        effectiveVariant = "default";
        label = label || "Completed";
        break;
      case "POSTPONED":
        effectiveVariant = "replaced";
        label = label || "Postponed";
        break;
      case "CANCELLED":
        effectiveVariant = "revoked";
        label = label || "Cancelled";
        break;
    }
  }

  const baseStyles =
    "inline-flex items-center font-montserrat font-semibold rounded-full border";

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3.5 py-1 text-xs tracking-wide",
  };

  const variantStyles = {
    // Certificate Status Colors: light tint background, dark text
    active: "bg-[#E6F4EA] text-[#00843D] border-[#A8DAB5]",
    revoked: "bg-[#FCE8E6] text-[#BA0C2F] border-[#F5C2BE]",
    replaced: "bg-[#FEF3D6] text-[#E87722] border-[#FAD79A]",
    notfound: "bg-[#F1F3F4] text-[#75787B] border-[#D1D5DB]",
    cyan: "bg-[#E0F7FA] text-[#002855] border-[#80DEEA]", // Process cyan highlight with Navy text (6.1:1)
    default: "bg-[#CCE0EB] text-[#002855] border-[#B8D4E4]",
  };

  return (
    <span
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[effectiveVariant],
        className
      )}
    >
      <span
        className={clsx("w-2 h-2 rounded-full mr-1.5", {
          "bg-[#00843D]": effectiveVariant === "active",
          "bg-[#BA0C2F]": effectiveVariant === "revoked",
          "bg-[#E87722]": effectiveVariant === "replaced",
          "bg-[#75787B]": effectiveVariant === "notfound",
          "bg-[#00B5E2]": effectiveVariant === "cyan",
          "bg-[#002855]": effectiveVariant === "default",
        })}
      />
      {label}
    </span>
  );
};
