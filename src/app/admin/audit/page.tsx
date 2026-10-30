"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { AuditLogItem, StaffUser } from "@/types";
import { History, ShieldCheck, Search, Filter } from "lucide-react";

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    async function load() {
      const live = await db.fetchAuditLogs();
      setLogs(live);
    }
    load();
    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.staffUser.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
            System Governance & Integrity
          </span>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
            Append-Only Immutable Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
            Cryptographic ledger tracking all batch uploads, dual-officer approvals,
            certificate revocations, name corrections, and treasurer payment reconciliations.
            Logs cannot be deleted or modified.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search audit trail by user, action, or entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-ieee-blue"
            />
          </div>

          <span className="text-xs text-gray-500 whitespace-nowrap">
            Total Logged Events: <strong>{logs.length}</strong>
          </span>
        </div>

        {/* Logs Table */}
        <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-montserrat uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Timestamp (UTC/PKT)</th>
                  <th className="p-4">Staff Officer</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-PK", {
                        timeZone: "Asia/Karachi",
                      })}
                    </td>

                    <td className="p-4 font-semibold text-gray-800">
                      {log.staffUser}
                    </td>

                    <td className="p-4">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-ieee-surfaceTint text-ieee-navy">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-gray-600">
                      {log.entityType}
                    </td>

                    <td className="p-4 text-gray-700 leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
