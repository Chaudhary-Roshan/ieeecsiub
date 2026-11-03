"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { testSupabaseConnection } from "@/lib/supabase";
import { DatabaseStatusModal } from "@/components/admin/DatabaseStatusModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileSpreadsheet,
  Award,
  CreditCard,
  QrCode,
  AlertTriangle,
  CheckCircle,
  History,
  ArrowRight,
  TrendingUp,
  Database,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { EventItem } from "@/types";

export default function AdminDashboardPage() {
  const [certsCount, setCertsCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedWipeEvent, setSelectedWipeEvent] = useState<string>("");
  const [wipeScope, setWipeScope] = useState<"ALL" | "ATTENDANCE_ONLY" | "CODES_ONLY">("ALL");
  const [isWiping, setIsWiping] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const conn = await testSupabaseConnection();
      setIsDbConnected(conn.isConnected);

      const liveCerts = await db.fetchCertificates();
      setCertsCount(liveCerts.length);
      const livePayments = await db.fetchPayments();
      setPendingPayments(livePayments.filter((p) => p.status === "PENDING"));
      const liveAudit = await db.fetchAuditLogs();
      setAuditLogs(liveAudit.slice(0, 5));

      const allEvts = await db.fetchEvents();
      setEvents(allEvts);
      if (allEvts.length > 0) {
        setSelectedWipeEvent(allEvts[0].id);
      }
    }
    loadStats();
  }, []);

  const handleWipeEventData = async () => {
    if (!selectedWipeEvent) return;
    const targetEvent = events.find((e) => e.id === selectedWipeEvent);
    const title = targetEvent?.title || "selected event";

    let confirmMsg = "";
    if (wipeScope === "ATTENDANCE_ONLY") {
      confirmMsg = `Are you sure you want to clear ATTENDANCE RECORDS ONLY for:\n"${title}"?\n\nExisting QR codes and verification codes will remain intact.`;
    } else if (wipeScope === "CODES_ONLY") {
      confirmMsg = `Are you sure you want to clear QR & VERIFICATION CODES ONLY for:\n"${title}"?\n\nThis will revoke/delete all issued verification records and QR codes for this event so you can regenerate fresh ones.`;
    } else {
      confirmMsg = `DANGER / FULL WIPE:\n\nAre you sure you want to permanently clear BOTH Attendance records AND QR/Verification codes for:\n"${title}"?\n\nThis resets all records for this event completely.`;
    }

    if (!confirm(confirmMsg)) return;

    setIsWiping(true);
    try {
      if (wipeScope === "ATTENDANCE_ONLY") {
        db.clearEventAttendanceOnly(selectedWipeEvent, targetEvent?.title);
        alert(`Successfully wiped attendance records for "${title}"! Existing QR/Verification codes remain preserved.`);
      } else if (wipeScope === "CODES_ONLY") {
        await db.clearEventCredentialsOnly(selectedWipeEvent, targetEvent?.title);
        const liveCerts = await db.fetchCertificates();
        setCertsCount(liveCerts.length);
        alert(`Successfully wiped all QR & verification codes for "${title}"! Attendance list remains intact.`);
      } else {
        await db.clearEventAttendanceAndCertificates(selectedWipeEvent, targetEvent?.title);
        const liveCerts = await db.fetchCertificates();
        setCertsCount(liveCerts.length);
        alert(`Successfully wiped both attendance records and QR/verification codes for "${title}"!`);
      }
    } catch (err: any) {
      alert("Wipe failed: " + err.message);
    } finally {
      setIsWiping(false);
    }
  };

  const handleWipeAllCertificates = async () => {
    if (
      !confirm(
        `EXTREME DANGER: Are you sure you want to delete ALL verification codes and QR records across the ENTIRE system?\n\nThis will wipe every credential and batch issued across all events so you can start completely fresh.`
      )
    ) {
      return;
    }
    setIsWiping(true);
    try {
      const count = await db.wipeAllCertificates();
      db.wipeAllAttendance();
      setCertsCount(0);
      alert(`Successfully wiped ${count} verification codes and reset all attendance records!`);
    } catch (err: any) {
      alert("Wipe failed: " + err.message);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Cloud Database Offline Notice */}
        {isDbConnected === false && (
          <div className="bg-amber-50 border border-amber-300 rounded-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Database size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="font-montserrat font-bold text-amber-950 text-sm">
                  Cloud Database Offline (Browser LocalStorage Mode Active)
                </h3>
                <p className="text-amber-800 leading-relaxed max-w-2xl">
                  The admin panel is currently saving records only inside this browser. To synchronize events, certificates, and team members with the live public website and mobile visitors across all devices, connect your Supabase database.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDbModalOpen(true)}
              className="px-4 py-2 bg-ieee-navy text-white font-montserrat font-bold rounded-lg hover:bg-ieee-blue transition-colors whitespace-nowrap self-start sm:self-center shadow-sm"
            >
              Connect Database &rarr;
            </button>
          </div>
        )}

        <DatabaseStatusModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
          onStatusChange={(st) => setIsDbConnected(st.isConnected)}
        />

        {/* Top Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Executive management portal for attendance tracking, tamper-proof QR verification codes, event check-ins, and verified registries.
          </p>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm">
            <span className="text-xs uppercase font-bold text-gray-500 block mb-1">
              Verified QR Credentials
            </span>
            <div className="text-3xl font-montserrat font-extrabold text-ieee-navy">
              {certsCount}
            </div>
            <span className="text-[11px] text-status-active font-medium mt-2 block">
              100% Verifiable on /verify
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm">
            <span className="text-xs uppercase font-bold text-gray-500 block mb-1">
              Active Chapter Events
            </span>
            <div className="text-3xl font-montserrat font-extrabold text-ieee-orange">
              {events.length}
            </div>
            <span className="text-[11px] text-gray-500 mt-2 block">
              Workshops & Technical Sessions
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm">
            <span className="text-xs uppercase font-bold text-gray-500 block mb-1">
              Payment Verification Queue
            </span>
            <div className="text-3xl font-montserrat font-extrabold text-ieee-blue">
              {pendingPayments.length}
            </div>
            <span className="text-[11px] text-gray-500 mt-2 block">
              Pending Treasurer Verification
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm">
            <span className="text-xs uppercase font-bold text-gray-500 block mb-1">
              Audit Trail Entries
            </span>
            <div className="text-3xl font-montserrat font-extrabold text-gray-800">
              {db.getAuditLogs().length}
            </div>
            <span className="text-[11px] text-gray-500 mt-2 block">
              Immutable Log Integrity
            </span>
          </div>
        </div>

        {/* Two-Column Workstation Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Action Workstations */}
          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm space-y-4">
            <h3 className="font-montserrat font-bold text-base text-ieee-navy border-b border-gray-100 pb-3">
              Standard Operating Workstations
            </h3>

            <div className="space-y-3 text-xs">
              <Link
                href="/admin/attendance"
                className="p-4 bg-gray-50 hover:bg-ieee-surfaceTint/30 rounded-xl border border-gray-200 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-ieee-blue text-white flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <h4 className="font-montserrat font-bold text-gray-900 group-hover:text-ieee-blue">
                      Attendance & QR Verification Code Hub
                    </h4>
                    <p className="text-gray-500 text-[11px]">
                      Upload sheets, mark attendance, generate in-app QR codes, export links, and download ZIP packages.
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/admin/certificates"
                className="p-4 bg-gray-50 hover:bg-ieee-surfaceTint/30 rounded-xl border border-gray-200 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00843D] text-white flex items-center justify-center">
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className="font-montserrat font-bold text-gray-900 group-hover:text-ieee-blue">
                      Verified Credentials & QR Registry
                    </h4>
                    <p className="text-gray-500 text-[11px]">
                      Search, audit, download single QR cards, replace misspelled names, and manage lifecycle.
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/admin/checkin"
                className="p-4 bg-gray-50 hover:bg-ieee-surfaceTint/30 rounded-xl border border-gray-200 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-ieee-navy text-white flex items-center justify-center">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h4 className="font-montserrat font-bold text-gray-900 group-hover:text-ieee-blue">
                      Mobile Check-in Scanner
                    </h4>
                    <p className="text-gray-500 text-[11px]">
                      Rapid on-site digital check-in scanner for workshop staff with duplicate detection.
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Recent Audit Log Snapshot */}
          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                <History size={16} className="text-ieee-blue" /> Recent Immutable Audit Trail
              </h3>
              <Link href="/admin/audit" className="text-xs text-ieee-blue hover:underline font-semibold">
                View Full Log
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-mono font-bold text-ieee-navy">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-700">{log.details}</p>
                  <span className="text-[10px] text-gray-400 block">By: {log.staffUser}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Database Maintenance & Data Wipe Section */}
        <div className="bg-white border border-red-200 rounded-card p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-100 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-red-600 uppercase tracking-wider">
                <Trash2 size={16} /> Database Maintenance & Data Wipe
              </div>
              <h3 className="font-montserrat font-bold text-lg text-ieee-navy mt-0.5">
                Clear Event Attendance & Verification QR Codes
              </h3>
              <p className="text-xs text-gray-500">
                Wipe event attendance sheets or QR / verification credentials with granular controls. Once issued, codes remain permanent until wiped here.
              </p>
            </div>
            {isWiping && (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                <RefreshCw size={14} className="animate-spin" /> Wiping database records...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Event Specific Wipe */}
            <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-3">
              <h4 className="font-montserrat font-bold text-sm text-gray-900">
                Wipe Selected Event Data
              </h4>
              <p className="text-xs text-gray-600">
                Choose the target event and exactly what you wish to delete:
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Target Event:</label>
                  <select
                    value={selectedWipeEvent}
                    onChange={(e) => setSelectedWipeEvent(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                  >
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1.5">What would you like to delete?</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer p-1.5 rounded hover:bg-red-100/50">
                      <input
                        type="radio"
                        name="wipeScope"
                        value="ALL"
                        checked={wipeScope === "ALL"}
                        onChange={() => setWipeScope("ALL")}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span><strong>Everything:</strong> Wipe Attendance + All QR Codes & Verification Codes</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer p-1.5 rounded hover:bg-red-100/50">
                      <input
                        type="radio"
                        name="wipeScope"
                        value="ATTENDANCE_ONLY"
                        checked={wipeScope === "ATTENDANCE_ONLY"}
                        onChange={() => setWipeScope("ATTENDANCE_ONLY")}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span><strong>Attendance Records Only:</strong> Keep issued QR / verification codes intact</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer p-1.5 rounded hover:bg-red-100/50">
                      <input
                        type="radio"
                        name="wipeScope"
                        value="CODES_ONLY"
                        checked={wipeScope === "CODES_ONLY"}
                        onChange={() => setWipeScope("CODES_ONLY")}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span><strong>QR & Verification Codes Only:</strong> Revoke codes to regenerate fresh ones</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleWipeEventData}
                  disabled={isWiping || !selectedWipeEvent}
                  className="w-full mt-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Wipe Selected Event Data
                </button>
              </div>
            </div>

            {/* Global Credential Registry Reset */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="font-montserrat font-bold text-sm text-gray-900">
                  Wipe All Verification Codes & QR Records (Complete Reset)
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Resets the entire verification and QR credential registry across all events in both the local storage and Supabase database. Use this if you want a complete blank slate before launching fresh events.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleWipeAllCertificates}
                  disabled={isWiping}
                  className="w-full px-4 py-2.5 border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Wipe All Credentials Across All Events (Full Reset)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
