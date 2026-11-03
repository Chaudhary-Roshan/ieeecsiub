"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Option 1 Registry Workstation has been merged completely into
 * Attendance & QR Verification Code Hub (/admin/attendance).
 *
 * This redirect ensures any bookmark or internal link navigates
 * directly to the unified Attendance & QR Hub.
 */
export default function RegistryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/attendance");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs font-montserrat text-gray-500">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-ieee-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Redirecting to Attendance &amp; QR Verification Code Hub...</p>
      </div>
    </div>
  );
}
