"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChapterLogo } from "@/components/layout/ChapterLogo";
import { Button } from "@/components/ui/Button";
import { INITIAL_STAFF_USERS } from "@/lib/constants";
import { StaffUser } from "@/types";
import { Lock, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [selectedStaffId, setSelectedStaffId] = useState(INITIAL_STAFF_USERS[0].id);
  const [otp, setOtp] = useState("889214");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = INITIAL_STAFF_USERS.find((u) => u.id === selectedStaffId) || INITIAL_STAFF_USERS[0];
    localStorage.setItem("ieee_cs_active_staff", JSON.stringify(user));

    // Set authentication cookies for server middleware verification
    document.cookie = "ieee_staff_session=true; path=/; max-age=604800; SameSite=Lax";
    document.cookie = `ieee_staff_role=${encodeURIComponent(user.role)}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `ieee_staff_name=${encodeURIComponent(user.name)}; path=/; max-age=604800; SameSite=Lax`;

    setTimeout(() => {
      setLoading(false);
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const target = params?.get("redirect") || "/admin";
      // Full navigation ensures middleware receives the fresh cookie
      window.location.href = target;
    }, 400);
  };

  return (
    <div className="min-h-screen bg-ieee-navy flex flex-col justify-center items-center p-4 font-openSans">
      <div className="max-w-md w-full bg-white rounded-card shadow-2xl overflow-hidden border border-white/20 space-y-6 p-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <ChapterLogo theme="light" />
          </div>
          <h1 className="font-montserrat font-extrabold text-2xl text-ieee-navy">
            Administrator Portal Login
          </h1>
          <p className="text-xs text-gray-500">
            Authenticated Access for Chapter Administrator
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Administrator Account
            </label>
            <div className="w-full p-2.5 border rounded-lg bg-gray-50 font-medium text-gray-800 flex items-center justify-between">
              <span>{INITIAL_STAFF_USERS[0].name}</span>
              <span className="text-[10px] bg-ieee-blue text-white px-2 py-0.5 rounded font-bold">
                {INITIAL_STAFF_USERS[0].role}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>Security Password</span>
              <span className="text-[10px] text-gray-400">Default Secure Token</span>
            </label>
            <div className="relative">
              <input
                type="password"
                defaultValue="••••••••••••"
                readOnly
                className="w-full p-2.5 border rounded-lg bg-gray-50 text-gray-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>Two-Factor Authentication Code (TOTP) *</span>
              <span className="text-[10px] text-status-active font-semibold">2FA Enabled</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="w-full p-2.5 border rounded-lg font-mono tracking-widest text-base text-center font-bold text-ieee-navy focus:ring-1 focus:ring-ieee-blue outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="md"
              className="w-full"
            >
              {loading ? "Verifying Credentials..." : "Authenticate & Open Admin Console"}
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center">
          <Link
            href="/"
            className="text-xs text-ieee-blue hover:underline font-semibold"
          >
            ← Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
