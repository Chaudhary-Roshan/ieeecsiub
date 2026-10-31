"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { EventItem, Registration } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatPKTDateOnly } from "@/lib/sha256";
import { FileText, Download, CheckCircle, ExternalLink, Users } from "lucide-react";

export default function VtoolsReportingPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    async function load() {
      const evts = await db.fetchEvents();
      setEvents(evts);
      if (evts.length > 0) setSelectedEventId(evts[0].id);
      const regs = await db.fetchRegistrations();
      setRegistrations(regs);
    }
    load();
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const attendees = registrations.filter(
    (r) => r.eventId === selectedEventId && (r.status === "ATTENDED" || r.status === "CONFIRMED")
  );

  const ieeeMembersCount = attendees.filter((a) => a.isIeeeMember).length;
  const guestCount = attendees.length - ieeeMembersCount;

  const handleDownloadCsv = () => {
    if (!selectedEvent) return;

    let csv = "IEEE vTools Meeting (L31) Attendance Report\n";
    csv += `Event Title,"${selectedEvent.title}"\n`;
    csv += `Activity Date,"${selectedEvent.startDate.split("T")[0]}"\n`;
    csv += `vTools ID,"${selectedEvent.vtoolsId || "N/A"}"\n`;
    csv += `Total Attendance,${attendees.length}\n`;
    csv += `IEEE Members,${ieeeMembersCount}\n`;
    csv += `Guests / Non-Members,${guestCount}\n\n`;

    csv += "Attendee Name,Status,IEEE Member,IEEE Number,Roll Number,Department\n";
    attendees.forEach((a) => {
      csv += `"${a.fullName}","${a.status}","${a.isIeeeMember ? "YES" : "NO"}","${
        a.ieeeMembershipNumber || ""
      }","${a.rollNumber}","${a.department}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vTools_L31_${selectedEvent.id}_Report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
            Compliance & Section Reporting
          </span>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
            IEEE vTools Meeting (L31) Attendance Export
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
            Generate standardized attendance aggregates (IEEE Member count vs. Non-Member
            Guest count) mandated for filing annual Section meeting reports on
            events.vtools.ieee.org.
          </p>
        </div>

        {/* Event Selector Card */}
        <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Completed or Ongoing Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-xs outline-none bg-white font-medium"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.status})
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              {/* Aggregate Statistics for L31 Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 border rounded-xl space-y-1">
                  <span className="text-[11px] text-gray-500 font-bold uppercase">
                    Total Attendees
                  </span>
                  <div className="text-2xl font-montserrat font-extrabold text-ieee-navy">
                    {attendees.length}
                  </div>
                </div>

                <div className="p-4 bg-[#E6F4EA] border border-[#A8DAB5] rounded-xl space-y-1">
                  <span className="text-[11px] text-[#00843D] font-bold uppercase">
                    IEEE Members Count
                  </span>
                  <div className="text-2xl font-montserrat font-extrabold text-[#00843D]">
                    {ieeeMembersCount}
                  </div>
                </div>

                <div className="p-4 bg-ieee-surfaceTint/50 border border-ieee-border rounded-xl space-y-1">
                  <span className="text-[11px] text-ieee-navy font-bold uppercase">
                    Non-Member Guests
                  </span>
                  <div className="text-2xl font-montserrat font-extrabold text-ieee-navy">
                    {guestCount}
                  </div>
                </div>
              </div>

              {/* Actions & Export */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="text-xs text-gray-500">
                  Target vTools ID:{" "}
                  <strong className="text-ieee-navy">{selectedEvent.vtoolsId || "Not Linked"}</strong>
                </div>

                <Button onClick={handleDownloadCsv} variant="primary" size="md">
                  <Download size={15} className="mr-2" /> Download L31 Form CSV Export
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
