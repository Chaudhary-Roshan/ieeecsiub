"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChapterLogo } from "../layout/ChapterLogo";
import { INITIAL_STAFF_USERS } from "@/lib/constants";
import { StaffUser } from "@/types";
import { db } from "@/lib/db";
import { testSupabaseConnection, SupabaseConfigStatus } from "@/lib/supabase";
import { DatabaseStatusModal } from "./DatabaseStatusModal";
import {
  LayoutDashboard,
  CalendarPlus,
  Award,
  Users,
  CreditCard,
  QrCode,
  FileText,
  History,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Database,
  ClipboardList,
  Share2,
  Menu,
  X,
  ExternalLink,
  LogOut,
} from "lucide-react";
import clsx from "clsx";

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<StaffUser>(INITIAL_STAFF_USERS[0]); // Dedicated Administrator
  const [dbStatus, setDbStatus] = useState<SupabaseConfigStatus | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileNavOpen]);

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
    { label: "Event Registrations", href: "/admin/registrations", icon: ClipboardList },
    { label: "Attendance & QR Generator", href: "/admin/attendance", icon: Users },
    { label: "Officers & Faculty Advisors", href: "/admin/team", icon: UserCheck },
    { label: "Verified Credentials Registry", href: "/admin/certificates", icon: Award },
    { label: "Payment Verification Queue", href: "/admin/payments", icon: CreditCard },
    { label: "Chapter Profile & Socials", href: "/admin/settings", icon: Share2 },
    { label: "Ticket Code Check-in", href: "/admin/checkin", icon: QrCode },
    { label: "vTools Reporting Export", href: "/admin/vtools-export", icon: FileText },
    { label: "Audit Logs", href: "/admin/audit", icon: History },
  ];

  const handleSyncDatabase = async () => {
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
  };

  const handleSignOut = () => {
    document.cookie = "ieee_staff_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "ieee_staff_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "ieee_staff_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("ieee_cs_active_staff");
    window.location.href = "/admin/login";
  };

  const currentNav = navItems.find((n) => n.href === pathname);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-openSans">
      {/* 1. Mobile Top Navigation Bar (Shown on small screens < md) */}
      <header className="md:hidden bg-ieee-navy text-white px-4 py-3 sticky top-0 z-40 flex items-center justify-between border-b border-white/10 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open Admin Menu"
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div>
            <div className="font-montserrat font-bold text-xs text-ieee-cyan flex items-center gap-1.5">
              <span>ADMIN CONSOLE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[11px] font-semibold text-gray-200 truncate max-w-[180px]">
              {currentNav?.label || "Console"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick DB status indicator on mobile */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className={clsx(
              "p-1.5 rounded-full border transition-colors",
              dbStatus?.isConnected
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                : "bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse"
            )}
            title="Database Status"
          >
            <Database size={14} />
          </button>

          <Link
            href="/"
            className="text-[11px] font-semibold text-gray-300 hover:text-white px-2 py-1 bg-white/10 rounded"
          >
            Public Site
          </Link>
        </div>
      </header>

      {/* 2. Mobile Slide-Over Drawer (Shown on small screens < md) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMobileNavOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 w-[82%] max-w-xs bg-ieee-navy text-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out border-r border-white/10">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <ChapterLogo theme="dark" condensed />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Admin Navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* Admin Profile Box */}
            <div className="p-3.5 bg-black/25 border-b border-white/10 text-xs">
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
              <div className="mt-2 text-[10px] text-gray-300 flex items-center justify-between border-t border-white/10 pt-1.5">
                <span>Authority: <strong className="text-status-active">Full Admin Access</strong></span>
                <span className="text-gray-400">2FA Active</span>
              </div>
            </div>

            {/* Navigation Links with custom scrollbar */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-montserrat font-semibold transition-all",
                      isActive
                        ? "bg-ieee-blue text-white shadow-sm font-bold"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon size={16} className={isActive ? "text-ieee-cyan" : "text-gray-400"} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Bottom Actions */}
            <div className="p-3 border-t border-white/10 space-y-2 bg-black/20 text-xs">
              <button
                onClick={handleSyncDatabase}
                disabled={isSyncing}
                className="w-full py-2 px-3 rounded bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={13} className={isSyncing ? "animate-spin text-ieee-cyan" : ""} />
                <span>{isSyncing ? "Syncing..." : "Sync Database"}</span>
              </button>

              <div className="flex items-center justify-between pt-1">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white flex items-center gap-1 text-xs"
                >
                  <span>Public Portal</span>
                  <ExternalLink size={11} />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs font-semibold"
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Desktop Dedicated Sidebar (Hidden on mobile < md) */}
      <aside className="hidden md:flex md:w-72 bg-ieee-navy text-white flex-shrink-0 flex-col justify-between border-r border-white/10 min-h-screen sticky top-0 h-screen overflow-y-auto custom-scrollbar">
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

      {/* 4. Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar for desktop & large screens */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-wider">
              Staff Session:
            </span>
            <span className="text-xs font-bold text-ieee-navy bg-ieee-surfaceTint/50 px-2.5 py-1 rounded-full truncate max-w-[200px]">
              {currentUser.name}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
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
              <span className="hidden xs:inline">
                {dbStatus?.isConnected
                  ? "Database: Live"
                  : "Database: Disconnected"}
              </span>
              <span className="xs:hidden">
                {dbStatus?.isConnected ? "DB Live" : "DB Offline"}
              </span>
            </button>

            <button
              onClick={handleSyncDatabase}
              disabled={isSyncing}
              className="px-2.5 py-1 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold border border-gray-300 transition-colors flex items-center gap-1.5"
              title="Clears stale local cache and pulls latest data from the live database"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin text-ieee-blue" : ""} />
              <span>{isSyncing ? "Syncing..." : "Sync DB"}</span>
            </button>

            <Link
              href="/verify"
              target="_blank"
              className="text-ieee-blue hover:underline font-semibold flex items-center gap-1 text-[11px]"
            >
              Verify <ExternalLink size={10} />
            </Link>

            <button
              onClick={handleSignOut}
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

        {/* Responsive Content Container */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
