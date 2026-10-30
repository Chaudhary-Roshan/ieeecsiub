"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { Registration, StaffUser } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  QrCode,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Search,
  Clock,
  Sparkles,
} from "lucide-react";

export default function MobileCheckinPage() {
  const [ticketInput, setTicketInput] = useState("");
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [resultMsg, setResultMsg] = useState<{
    type: "SUCCESS" | "WARNING" | "ERROR";
    title: string;
    description: string;
  } | null>(null);

  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    setRegistrations(db.getRegistrations());
    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = ticketInput.trim();
    if (!cleanCode) return;

    const staffName = currentUser?.name || "Check-in Staff";
    const res = db.recordCheckin(cleanCode, staffName);

    if (res.success && res.reg) {
      setResultMsg({
        type: "SUCCESS",
        title: "Check-in Successful!",
        description: `Verified ${res.reg.fullName} (${res.reg.department || "UCET"}). Ticket status marked as ATTENDED.`,
      });
      setTicketInput("");
    } else {
      if (res.reg && res.reg.status === "ATTENDED") {
        setResultMsg({
          type: "WARNING",
          title: "Duplicate Check-in Alert!",
          description: `Warning: ${res.reg.fullName} was ALREADY checked in on ${new Date(
            res.reg.checkedInAt || ""
          ).toLocaleTimeString()}. Do not admit duplicate wristband/badge.`,
        });
      } else {
        setResultMsg({
          type: "ERROR",
          title: "Ticket Code Not Found",
          description: `No active registration matches ticket code "${cleanCode}".`,
        });
      }
    }

    setRegistrations(db.getRegistrations());
  };

  const attendedList = registrations.filter((r) => r.status === "ATTENDED");

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
            Option 2: On-Site Event Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
            Mobile QR Ticket Check-in Scanner
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
            Fast, high-throughput attendee check-in for workshop entrances. Warns
            instantly against duplicate or reused QR tickets.
          </p>
        </div>

        {/* Scanner / Code Input Workstation */}
        <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 shadow-sm space-y-6">
          <form onSubmit={handleScanSubmit} className="space-y-4">
            <label className="block font-montserrat font-bold text-xs uppercase tracking-wider text-gray-700">
              Scan Ticket QR or Enter Ticket Code
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <QrCode size={22} />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="e.g. TCK-AI-9021"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-base md:text-lg font-mono tracking-wider uppercase border border-gray-300 rounded-xl focus:ring-2 focus:ring-ieee-blue outline-none transition-all placeholder:normal-case placeholder:font-sans placeholder:text-gray-400"
              />
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full">
              Record Attendance
            </Button>
          </form>

          {/* Quick Demo Pre-filled Links */}
          <div className="pt-2">
            <span className="text-[11px] text-gray-400 block mb-1">
              Test Sample Ticket IDs from Registrations:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTicketInput("TCK-AI-9021")}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded font-mono text-gray-800"
              >
                TCK-AI-9021 (Muhammad Daniyal)
              </button>
              <button
                type="button"
                onClick={() => setTicketInput("TCK-AI-9022")}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded font-mono text-gray-800"
              >
                TCK-AI-9022 (Sana Tariq)
              </button>
            </div>
          </div>

          {/* Result Banner */}
          {resultMsg && (
            <div
              className={`p-5 rounded-xl border flex items-start gap-3 transition-all ${
                resultMsg.type === "SUCCESS"
                  ? "bg-[#E6F4EA] border-[#A8DAB5] text-[#00843D]"
                  : resultMsg.type === "WARNING"
                  ? "bg-[#FEF3D6] border-[#FAD79A] text-[#B45309]"
                  : "bg-[#FCE8E6] border-[#F5C2BE] text-[#BA0C2F]"
              }`}
            >
              {resultMsg.type === "SUCCESS" && (
                <CheckCircle size={22} className="flex-shrink-0 mt-0.5" />
              )}
              {resultMsg.type === "WARNING" && (
                <AlertTriangle size={22} className="flex-shrink-0 mt-0.5" />
              )}
              {resultMsg.type === "ERROR" && (
                <AlertTriangle size={22} className="flex-shrink-0 mt-0.5" />
              )}

              <div className="space-y-1 text-xs">
                <p className="font-montserrat font-bold text-sm">
                  {resultMsg.title}
                </p>
                <p className="leading-relaxed">{resultMsg.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Live Attendance Counter */}
        <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
              <Clock size={16} className="text-ieee-blue" />
              Live Checked-in Attendees ({attendedList.length})
            </h3>
            <span className="text-xs text-status-active font-semibold">
              Live Room Count
            </span>
          </div>

          {attendedList.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">
              No attendees checked in yet today.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {attendedList.map((att) => (
                <div
                  key={att.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-gray-900 block">{att.fullName}</span>
                    <span className="text-[11px] text-gray-500">
                      {att.rollNumber} • {att.department}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-ieee-blue font-semibold block">
                      {att.ticketCode}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Checked in at {new Date(att.checkedInAt || "").toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
