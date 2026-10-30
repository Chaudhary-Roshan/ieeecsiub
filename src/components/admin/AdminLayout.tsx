"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChapterLogo } from "../layout/ChapterLogo";
import { INITIAL_STAFF_USERS } from "@/lib/constants";
import { StaffUser, StaffRole } from "@/types";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Award,
  CreditCard,
  QrCode,
  CheckCircle2,
  FileText,
  History,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import clsx from "clsx";

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<StaffUser>(INITIAL_STAFF_USERS[1]); // Default to Certificate Approver (Dr. Aoun Muhammad)

  useEffect(() => {
    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleSwitchUser = (user: StaffUser) => {
    setCurrentUser(user);
    localStorage.setItem("ieee_cs_active_staff", JSON.stringify(user));
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Option 1: Code Generator & Staging", href: "/admin/registry", icon: FileSpreadsheet },
    { label: "Certificate Records (Revoke/Replace)", href: "/admin/certificates", icon: Award },
    { label: "Option 2: Payments Queue (Treasurer)", href: "/admin/payments", icon: CreditCard },
    { label: "Option 2: Mobile Check-in Scanner", href: "/admin/checkin", icon: QrCode },
    { label: "Option 2: Eligibility & In-site Issuance", href: "/admin/issuance", icon: CheckCircle2 },
    { label: "vTools L31 Reporting", href: "/admin/vtools-export", icon: FileText },
    { label: "Immutable Audit Logs", href: "/admin/audit", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-openSans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-ieee-navy text-white flex-shrink-0 flex flex-col justify-between border-r border-white/10">
        <div>
          {/* Top Header */}
          <div className="p-5 border-b border-white/10">
            <ChapterLogo theme="dark" condensed />
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-300">
              <span className="font-montserrat font-bold text-ieee-cyan">
                ADMIN CONSOLE
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                <ShieldCheck size={11} className="text-status-active" /> 2FA Active
              </span>
            </div>
          </div>

          {/* Role Switcher for Pair-Programming Testing */}
          <div className="p-4 bg-black/20 border-b border-white/10 text-xs">
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5 flex items-center gap-1">
              <UserCheck size={12} className="text-ieee-orange" /> Active Role Simulation
            </label>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = INITIAL_STAFF_USERS.find((u) => u.id === e.target.value);
                if (found) handleSwitchUser(found);
              }}
              className="w-full bg-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 border border-white/20 focus:outline-none focus:ring-1 focus:ring-ieee-orange"
            >
              {INITIAL_STAFF_USERS.map((u) => (
                <option key={u.id} value={u.id} className="bg-ieee-navy text-white">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <div className="mt-2 text-[10px] text-gray-300 flex items-center justify-between">
              <span>Role: <strong className="text-ieee-orange">{currentUser.role}</strong></span>
              <span>Tenure: {currentUser.tenureEnd.slice(0, 4)}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-montserrat font-semibold transition-all",
                    isActive
                      ? "bg-ieee-blue text-white shadow-sm"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={16} className={isActive ? "text-ieee-cyan" : "text-gray-400"} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Info & Public Link */}
        <div className="p-4 border-t border-white/10 text-xs text-gray-400 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between text-gray-300 hover:text-white transition-colors py-1 font-semibold"
          >
            <span>Exit to Public Portal</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-wider">
              IEEE CS UCET-IUB Staff Session:
            </span>
            <span className="text-xs font-bold text-ieee-navy bg-ieee-surfaceTint/50 px-2.5 py-1 rounded-full">
              {currentUser.name}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/verify"
              target="_blank"
              className="text-ieee-blue hover:underline font-semibold flex items-center gap-1"
            >
              Public Verify Page
            </Link>
          </div>
        </header>

        {/* Content Children */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
};
