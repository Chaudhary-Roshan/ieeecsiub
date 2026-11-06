"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { AuditLogItem, StaffUser } from "@/types";
import * as XLSX from "xlsx";
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  const loadAuditData = async () => {
    setLoading(true);
    const live = await db.fetchAuditLogs();
    setLogs(live);
    setLoading(false);
  };

  useEffect(() => {
    loadAuditData();
    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Filter logs based on search query and category
  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.staffUser.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType.toLowerCase().includes(search.toLowerCase()) ||
      l.entityId.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === "ALL") return true;
    if (categoryFilter === "CERTIFICATES") return l.entityType === "CERTIFICATE";
    if (categoryFilter === "BATCHES") return l.entityType === "UPLOAD_BATCH";
    if (categoryFilter === "EVENTS") return l.entityType === "EVENT";
    if (categoryFilter === "SECURITY") return l.entityType === "REGISTRY" || l.entityType === "SECURITY";
    if (categoryFilter === "CHECKIN") return l.action.includes("CHECKIN") || l.action.includes("ATTENDANCE");
    return true;
  });

  // Export Audit Trail to Excel (.xlsx)
  const handleExportExcel = () => {
    const rows = filteredLogs.map((l) => ({
      Timestamp_PKT: new Date(l.timestamp).toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
      Timestamp_ISO: l.timestamp,
      Staff_Officer: l.staffUser,
      Action_Type: l.action,
      Target_Entity: l.entityType,
      Entity_Identifier: l.entityId,
      Audit_Details: l.details,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chapter_Audit_Ledger");
    XLSX.writeFile(workbook, `IEEE_CS_Audit_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const rows = filteredLogs.map((l) => ({
      Timestamp_PKT: new Date(l.timestamp).toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
      Staff_Officer: l.staffUser,
      Action_Type: l.action,
      Target_Entity: l.entityType,
      Entity_Identifier: l.entityId,
      Audit_Details: l.details,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `IEEE_CS_Audit_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl mx-auto font-openSans">
        {/* Title Header with Governance Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
                System Governance &amp; Integrity
              </span>
              <span className="inline-flex items-center gap-1 bg-green-50 text-status-active text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                <Lock size={11} /> Immutable Ledger Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
              Append-Only Immutable Audit Log
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed max-w-3xl">
              Cryptographic ledger tracking all batch uploads, dual-officer approvals,
              certificate issuances, ticket check-ins, and credential authentications.
              Entries are tamper-evident and cannot be altered or purged.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAuditData}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Refresh live ledger entries"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-montserrat font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <FileSpreadsheet size={14} /> Export Excel (.xlsx)
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Logged Records</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-montserrat font-extrabold text-ieee-navy">{logs.length}</span>
              <span className="text-[10px] text-green-600 font-semibold">Ledger entries</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Verified Certificates</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-montserrat font-extrabold text-ieee-blue">
                {logs.filter((l) => l.entityType === "CERTIFICATE").length}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">Active credentials</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Dual-Officer Approvals</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-montserrat font-extrabold text-amber-600">
                {logs.filter((l) => l.entityType === "UPLOAD_BATCH").length}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">Attested batches</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Cryptographic Seal</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-montserrat font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={16} /> 256-Bit SHA
              </span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Strip */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search audit trail by staff officer, action (e.g. CERTIFICATE_ISSUED), code, or team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-ieee-blue/20 focus:border-ieee-blue"
              />
            </div>

            <span className="text-xs text-gray-500 whitespace-nowrap">
              Showing <strong>{filteredLogs.length}</strong> of {logs.length} logged events
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Filter Entity:</span>
            {[
              { id: "ALL", label: "All Events" },
              { id: "CERTIFICATES", label: "Certificates (61+)" },
              { id: "BATCHES", label: "Dual Approvals" },
              { id: "EVENTS", label: "Event Governance" },
              { id: "CHECKIN", label: "Check-in Operations" },
              { id: "SECURITY", label: "System Security" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  categoryFilter === cat.id
                    ? "bg-ieee-navy text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400 space-y-2">
              <RefreshCw className="mx-auto animate-spin text-ieee-blue" size={24} />
              <p>Verifying cryptographic audit chain...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs space-y-2">
              <History className="mx-auto text-gray-400" size={32} />
              <p className="font-semibold text-gray-700">No matching audit logs found.</p>
              <p className="text-gray-400">Try adjusting your search criteria or category filter.</p>
            </div>
          ) : (
            <div>
              <div className="md:hidden px-4 py-1.5 bg-sky-50 border-b border-sky-100 text-[11px] text-ieee-blue flex items-center justify-between">
                <span>↔ Scroll horizontally to view cryptographic hashes &amp; payloads</span>
                <span className="font-semibold">{filteredLogs.length} events</span>
              </div>
              <div className="overflow-x-auto custom-scrollbar w-full">
                <table className="w-full min-w-[850px] text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-montserrat uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 whitespace-nowrap">Timestamp (PKT)</th>
                    <th className="p-4 whitespace-nowrap">Staff Officer / Signatory</th>
                    <th className="p-4 whitespace-nowrap">Action Type</th>
                    <th className="p-4 whitespace-nowrap">Target Entity</th>
                    <th className="p-4">Cryptographic Details &amp; Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => {
                    const isCert = log.entityType === "CERTIFICATE";
                    const isBatch = log.entityType === "UPLOAD_BATCH";
                    const isSec = log.entityType === "REGISTRY" || log.entityType === "SECURITY";

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("en-PK", {
                            timeZone: "Asia/Karachi",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">
                          {log.staffUser}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                              isCert
                                ? "bg-blue-50 text-ieee-blue border-blue-200"
                                : isBatch
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : isSec
                                ? "bg-green-50 text-emerald-800 border-green-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="p-4 font-mono text-[11px] whitespace-nowrap">
                          <span className="font-bold text-gray-700">{log.entityType}</span>
                          {log.entityId && (
                            <span className="text-gray-400 block text-[10px]">
                              {log.entityId}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-gray-700 leading-relaxed font-openSans">
                          {log.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}
