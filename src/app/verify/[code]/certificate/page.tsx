"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StandaloneCertificateViewPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code ? decodeURIComponent(params.code as string) : "";

  useEffect(() => {
    if (rawCode) {
      router.replace(`/verify/${rawCode}`);
    } else {
      router.replace("/verify");
    }
  }, [rawCode, router]);

  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-montserrat text-gray-600">Redirecting to official verification record...</p>
      </div>
    </div>
  );
}
