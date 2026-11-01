"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChapterLogo } from "../layout/ChapterLogo";
import { INITIAL_STAFF_USERS } from "@/lib/constants";
import { StaffUser, StaffRole } from "@/types";
import { db } from "@/lib/db";
import { testSupabaseConnection, SupabaseConfigStatus } from "@/lib/supabase";
import { DatabaseStatusModal } from "./DatabaseStatusModal";
import {
  LayoutDashboard,
  CalendarPlus,
  FileSpreadsheet,
  Award,
  Palette,
  Users,
  CreditCard,
  QrCode,
  CheckCircle2,
  FileText,
  History,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Database,
} from "lucide-react";
import clsx from "clsx";

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<StaffUser>(INITIAL_STAFF_USERS[0]); // Dedicated Administrator
  const [dbStatus, setDbStatus] = useState<SupabaseConfigStatus | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    testSupabaseConnection().then((st) => setDbStatus(st));

    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id === INITIAL_STAFF_USERS[0].id) {
          setCurrentUser(parsed);
        } else {
          setCurrentUser(INITIAL_STAFF_USERS[0]);
          localStorage.setItem("ieee_cs_active_staff", JSON.stringify(INITIAL_STAFF_USERS[0]));
        }
      } catch {
        setCurrentUser(INITIAL_STAFF_USERS[0]);
      }
    } else {
      localStorage.setItem("ieee_cs_active_staff", JSON.stringify(INITIAL_STAFF_USERS[0]));
    }
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Manage All Events", href: "/admin/events", icon: CalendarPlus },
    { label: "Officers & Faculty Advisors", href: "/admin/team", icon: UserCheck },
    { label: "Certificate Registry & QR Pack", href: "/admin/registry", icon: FileSpreadsheet },
    { label: "Manage Certificates", href: "/admin/certificates", icon: Award },
    { label: "Custom HTML Templates", href: "/admin/templates", icon: Palette },
    { label: "Attendance & Bulk PDF", href: "/admin/attendance", icon: Users },
    { label: "Payment Verification Queue", href: "/admin/payments", icon: CreditCard },
    { label: "Mobile Check-in Scanner", href: "/admin/checkin", icon: QrCode },
    { label: "Eligibility & In-Site Issuance", href: "/admin/issuance", icon: CheckCircle2 },
    { label: "vTools Reporting Export", href: "/admin/vtools-export", icon: FileText },
    { label: "Audit Logs", href: "/admin/audit", icon: History },
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

          {/* Dedicated Administrator Profile */}
          <div className="p-4 bg-black/20 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-ieee-orange text-black font-montserrat font-bold flex items-center justify-center text-xs shadow-sm">
                A
              </div>
              <div className="overflow-hidden">
                <div className="font-montserrat font-bold text-white text-xs truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-ieee-cyan font-semibold flex items-center gap-1">
                  <UserCheck size={11} /> System Administrator
                </div>
              </div>
            </div>
            <div className="mt-2.5 text-[10px] text-gray-300 flex items-center justify-between border-t border-white/10 pt-2">
              <span>Authority: <strong className="text-status-active">Full Admin Access</strong></span>
              <span className="text-gray-400">All Modules</span>
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
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-wider">
              IEEE CS UCET-IUB Staff Session:
            </span>
            <span className="text-xs font-bold text-ieee-navy bg-ieee-surfaceTint/50 px-2.5 py-1 rounded-full">
              {currentUser.name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            {/* Real-time Database Status Pill */}
            <button
              onClick={() => setIsDbModalOpen(true)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all shadow-sm",
                dbStatus?.isConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse"
              )}
              title="Click to check or configure database connection"
            >
              <Database size={13} className={dbStatus?.isConnected ? "text-emerald-600" : "text-amber-600"} />
              <span>
                {dbStatus?.isConnected
                  ? "Database: Live Connected"
                  : "Database: Disconnected (Configure)"}
              </span>
            </button>

            <button
              onClick={async () => {
                setIsSyncing(true);
                try {
                  db.resetAll();
                  await Promise.allSettled([
                    db.fetchEvents(),
                    db.fetchTeamMembers(),
                    db.fetchCertificates(),
                    db.fetchTemplates(),
                  ]);
                  window.location.reload();
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="px-2.5 py-1 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold border border-gray-300 transition-colors flex items-center gap-1.5"
              title="Clears stale local cache and pulls latest data from the live database"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin text-ieee-blue" : ""} />
              <span>{isSyncing ? "Syncing..." : "Sync Database"}</span>
            </button>
            <Link
              href="/verify"
              target="_blank"
              className="text-ieee-blue hover:underline font-semibold flex items-center gap-1 text-[11px]"
            >
              Public Verify Page
            </Link>
            <button
              onClick={() => {
                document.cookie = "ieee_staff_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie = "ieee_staff_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie = "ieee_staff_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                localStorage.removeItem("ieee_cs_active_staff");
                window.location.href = "/admin/login";
              }}
              className="px-2.5 py-1 text-[11px] rounded bg-red-50 hover:bg-red-100 text-red-600 font-semibold border border-red-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Database Configuration Modal */}
        <DatabaseStatusModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
          onStatusChange={(newStatus) => setDbStatus(newStatus)}
        />

        {/* Content Children */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
};
