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
  const [stagedBatches, setStagedBatches] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedWipeEvent, setSelectedWipeEvent] = useState<string>("");
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
      setStagedBatches(db.getBatches().filter((b) => b.status === "STAGED"));

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
    if (
      !confirm(
        `DANGER: Are you sure you want to permanently clear all attendance records and certificates for:\n"${title}"?\n\nThis will wipe the data so you can re-upload fresh records.`
      )
    ) {
      return;
    }
    setIsWiping(true);
    try {
      await db.clearEventAttendanceAndCertificates(selectedWipeEvent, targetEvent?.title);
      const liveCerts = await db.fetchCertificates();
      setCertsCount(liveCerts.length);
      alert(`Successfully wiped attendance records and certificates for "${title}"!`);
    } catch (err: any) {
      alert("Wipe failed: " + err.message);
    } finally {
      setIsWiping(false);
    }
  };

  const handleWipeAllCertificates = async () => {
    if (
      !confirm(
        `EXTREME DANGER: Are you sure you want to delete ALL certificates from the database?\n\nThis will wipe every certificate issued across all events so you can start completely fresh.`
      )
    ) {
      return;
    }
    setIsWiping(true);
    try {
      const count = await db.wipeAllCertificates();
      db.wipeAllAttendance();
      setCertsCount(0);
      alert(`Successfully wiped ${count} certificates and reset all attendance records!`);
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
            Overview of Chapter Certificate Registry, Option 1 staging queue, and Option 2
            event check-ins.
          </p>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm">
            <span className="text-xs uppercase font-bold text-gray-500 block mb-1">
              Total Certificates
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
              Option 1 Staging Batches
            </span>
            <div className="text-3xl font-montserrat font-extrabold text-ieee-orange">
              {stagedBatches.length}
            </div>
            <span className="text-[11px] text-gray-500 mt-2 block">
              Awaiting 2nd Officer Approval
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm">
            <span className="text-xs uppercase font-bold text-gray-500 block mb-1">
              Option 2 Payment Queue
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

        {/* Alert Queue: Staged Batches Awaiting Second-Officer Approval */}
        {stagedBatches.length > 0 && (
          <div className="bg-[#FEF3D6] border border-[#FAD79A] rounded-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#B45309]">
                <AlertTriangle size={20} />
                <h3 className="font-montserrat font-bold text-sm sm:text-base">
                  Action Required: {stagedBatches.length} Staged Batch Ready for Approver Sign-off
                </h3>
              </div>
              <Button href="/admin/registry" variant="primary" size="sm">
                Review Staging Queue
              </Button>
            </div>
            <p className="text-xs text-[#B45309] leading-relaxed">
              In adherence with the chapter governance policy, staged CSV participant lists
              remain hidden from the public verification page until explicitly authorized by a
              Certificate Approver (Faculty Advisor or Chapter Chair).
            </p>
          </div>
        )}

        {/* Two-Column Workstation Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Action Workstations */}
          <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm space-y-4">
            <h3 className="font-montserrat font-bold text-base text-ieee-navy border-b border-gray-100 pb-3">
              Standard Operating Workstations
            </h3>

            <div className="space-y-3 text-xs">
              <Link
                href="/admin/registry"
                className="p-4 bg-gray-50 hover:bg-ieee-surfaceTint/30 rounded-xl border border-gray-200 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-ieee-blue text-white flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <h4 className="font-montserrat font-bold text-gray-900 group-hover:text-ieee-blue">
                      Option 1: Code Generator & Batch Upload
                    </h4>
                    <p className="text-gray-500 text-[11px]">
                      Generate CSIUB-26 codes, export QR packages, upload participant CSVs.
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
                      Certificate Lifecycle Records
                    </h4>
                    <p className="text-gray-500 text-[11px]">
                      Revoke, replace misspelled names, and audit existing certificates.
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
                      Option 2: Mobile Check-in Scanner
                    </h4>
                    <p className="text-gray-500 text-[11px]">
                      Rapid attendance recorder for workshop check-in staff with duplicate detection.
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
                Clear Event Attendance & Certificate Data
              </h3>
              <p className="text-xs text-gray-500">
                Wipe event attendance sheets or certificates so you can upload fresh corrected data. Once certificates are issued, their codes stay permanent until wiped here.
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
                Permanently clears all attendance records and certificates for a specific event so you can re-upload a clean attendance sheet.
              </p>
              <div className="space-y-2">
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

                <button
                  onClick={handleWipeEventData}
                  disabled={isWiping || !selectedWipeEvent}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Clear Attendance & Certificates for Selected Event
                </button>
              </div>
            </div>

            {/* Global Certificate Registry Reset */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h4 className="font-montserrat font-bold text-sm text-gray-900">
                Wipe All Registry Certificates
              </h4>
              <p className="text-xs text-gray-600">
                Resets the entire certificate registry across all events. Use this if you want a complete blank slate before launching fresh events.
              </p>
              <div className="pt-8">
                <button
                  onClick={handleWipeAllCertificates}
                  disabled={isWiping}
                  className="w-full px-4 py-2 border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Clear All Certificates Registry (Full Reset)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
