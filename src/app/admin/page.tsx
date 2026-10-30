"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
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
} from "lucide-react";

export default function AdminDashboardPage() {
  const [certsCount, setCertsCount] = useState(0);
  const [stagedBatches, setStagedBatches] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    setCertsCount(db.getCertificates().length);
    setStagedBatches(db.getBatches().filter((b) => b.status === "STAGED"));
    setPendingPayments(db.getPayments().filter((p) => p.status === "PENDING"));
    setAuditLogs(db.getAuditLogs().slice(0, 5));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
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
      </div>
    </AdminLayout>
  );
}
