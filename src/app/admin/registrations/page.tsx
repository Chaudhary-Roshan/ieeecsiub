"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { EventItem, Registration, AttendanceRecord } from "@/types";
import { formatPKTDateTime } from "@/lib/sha256";
import * as XLSX from "xlsx";
import {
  ClipboardList,
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Users,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Ticket,
} from "lucide-react";

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editDept, setEditDept] = useState("Computer Science");
  const [editStatus, setEditStatus] = useState<Registration["status"]>("CONFIRMED");
  const [editIsIeee, setEditIsIeee] = useState(false);
  const [editIeeeNo, setEditIeeeNo] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEventId, setAddEventId] = useState("");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addRoll, setAddRoll] = useState("");
  const [addDept, setAddDept] = useState("Computer Science");
  const [addStatus, setAddStatus] = useState<Registration["status"]>("CONFIRMED");
  const [addIsIeee, setAddIsIeee] = useState(false);
  const [addIeeeNo, setAddIeeeNo] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Action Feedback States
  const [copiedTicket, setCopiedTicket] = useState<string | null>(null);
  const [pushingAttendanceId, setPushingAttendanceId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [liveRegs, liveEvents] = await Promise.all([
      db.fetchRegistrations(),
      db.fetchEvents(),
    ]);
    setRegistrations(liveRegs);
    setEvents(liveEvents);
    if (liveEvents.length > 0 && !addEventId) {
      setAddEventId(liveEvents[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const eventMap = new Map<string, EventItem>();
  events.forEach((ev) => eventMap.set(ev.id, ev));

  // Copy Ticket Code
  const handleCopyTicket = (ticket: string) => {
    navigator.clipboard.writeText(ticket);
    setCopiedTicket(ticket);
    setTimeout(() => setCopiedTicket(null), 2000);
  };

  // Open Edit Modal
  const handleOpenEdit = (reg: Registration) => {
    setEditingReg(reg);
    setEditName(reg.fullName || "");
    setEditEmail(reg.email || "");
    setEditPhone(reg.phone || "");
    setEditRoll(reg.rollNumber || "");
    setEditDept(reg.department || "Computer Science");
    setEditStatus(reg.status || "CONFIRMED");
    setEditIsIeee(Boolean(reg.isIeeeMember));
    setEditIeeeNo(reg.ieeeMembershipNumber || "");
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg || !editName.trim()) return;

    setIsSavingEdit(true);
    try {
      await db.updateRegistration(editingReg.id, {
        fullName: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim() || undefined,
        rollNumber: editRoll.trim() || "",
        department: editDept.trim() || "Computer Science",
        status: editStatus,
        isIeeeMember: editIsIeee,
        ieeeMembershipNumber: editIeeeNo.trim() || undefined,
      });

      const updated = registrations.map((r) =>
        r.id === editingReg.id
          ? {
              ...r,
              fullName: editName.trim(),
              email: editEmail.trim().toLowerCase(),
              phone: editPhone.trim() || undefined,
              rollNumber: editRoll.trim() || "",
              department: editDept.trim() || "Computer Science",
              status: editStatus,
              isIeeeMember: editIsIeee,
              ieeeMembershipNumber: editIeeeNo.trim() || undefined,
            }
          : r
      );
      setRegistrations(updated);
      setEditingReg(null);
    } catch (err: any) {
      alert("Failed to update registration: " + (err?.message || ""));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Registration
  const handleDeleteRegistration = async (reg: Registration) => {
    if (
      !confirm(
        `Are you sure you want to permanently remove registration for "${reg.fullName}" (${reg.rollNumber || reg.email})?`
      )
    ) {
      return;
    }

    try {
      await db.deleteRegistration(reg.id);
      const filtered = registrations.filter((r) => r.id !== reg.id);
      setRegistrations(filtered);
    } catch (err: any) {
      alert("Failed to delete registration: " + (err?.message || ""));
    }
  };

  // Add Manual Registration
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addEventId) return;

    setIsAdding(true);
    try {
      const crypto = await import("crypto");
      const ticketCode = "TCK-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      const privateToken = Math.random().toString(36).substring(2, 18);
      const regId = `reg-${Date.now()}`;

      const newReg: Registration = {
        id: regId,
        eventId: addEventId,
        privateToken,
        fullName: addName.trim(),
        namePreference: "FULL_NAME",
        email: addEmail.trim().toLowerCase(),
        phone: addPhone.trim() || undefined,
        rollNumber: addRoll.trim() || "",
        department: addDept.trim() || "Computer Science",
        isIeeeMember: addIsIeee,
        ieeeMembershipNumber: addIeeeNo.trim() || undefined,
        photoConsent: true,
        status: addStatus,
        ticketCode,
        createdAt: new Date().toISOString(),
      };

      await db.addRegistration(newReg);
      setRegistrations([newReg, ...registrations]);
      setIsAddModalOpen(false);

      // Reset fields
      setAddName("");
      setAddEmail("");
      setAddPhone("");
      setAddRoll("");
      setAddIeeeNo("");
      setAddIsIeee(false);
      alert(`Registration created successfully with ticket code: ${ticketCode}`);
    } catch (err: any) {
      alert("Failed to add registration: " + (err?.message || ""));
    } finally {
      setIsAdding(false);
    }
  };

  // Push to Event Attendance Sheet
  const handlePushToAttendance = async (reg: Registration) => {
    setPushingAttendanceId(reg.id);
    try {
      const currentAttendance = db.getAttendance(reg.eventId);
      const exists = currentAttendance.some(
        (a) =>
          (reg.rollNumber && a.rollNumber && a.rollNumber.trim().toUpperCase() === reg.rollNumber.trim().toUpperCase()) ||
          (a.email && a.email.trim().toLowerCase() === reg.email.trim().toLowerCase())
      );

      if (exists) {
        alert(`${reg.fullName} is already in the attendance sheet for this event.`);
        setPushingAttendanceId(null);
        return;
      }

      const newAttendee: AttendanceRecord = {
        id: `att-${Date.now()}`,
        eventId: reg.eventId,
        name: reg.fullName,
        rollNumber: reg.rollNumber || undefined,
        email: reg.email,
        attended: reg.status === "ATTENDED",
        checkedInAt: reg.status === "ATTENDED" ? new Date().toISOString() : undefined,
      };

      const updated = [...currentAttendance, newAttendee];
      db.saveAttendance(reg.eventId, updated);

      alert(`Added "${reg.fullName}" to the Event Attendance Sheet! You can now generate their QR code from the Attendance Hub.`);
    } catch (err: any) {
      alert("Failed to push to attendance: " + (err?.message || ""));
    } finally {
      setPushingAttendanceId(null);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredRegistrations.length === 0) {
      alert("No registrations available to export.");
      return;
    }

    const rows = filteredRegistrations.map((r, idx) => {
      const ev = eventMap.get(r.eventId);
      return {
        "Sr #": idx + 1,
        "Full Name": r.fullName,
        "Roll Number": r.rollNumber || "N/A",
        "Email Address": r.email,
        "Phone Number": r.phone || "N/A",
        "Event Title": ev?.title || "N/A",
        "Department": r.department || "Computer Science",
        "IEEE Member": r.isIeeeMember ? "Yes" : "No",
        "IEEE Membership #": r.ieeeMembershipNumber || "N/A",
        "Ticket Code": r.ticketCode || "N/A",
        "Registration Status": r.status,
        "Registered At": r.createdAt ? formatPKTDateTime(r.createdAt) : "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Auto-fit column widths
    const maxCols = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 16),
    }));
    worksheet["!cols"] = maxCols;

    const eventName =
      selectedEventId === "ALL"
        ? "All_Events"
        : (eventMap.get(selectedEventId)?.slug.replace(/\//g, "_") || "Event");

    XLSX.writeFile(workbook, `IEEE_CS_Registrations_${eventName}.xlsx`);
  };

  // Filter Registrations
  const filteredRegistrations = registrations.filter((r) => {
    const matchesEvent = selectedEventId === "ALL" || r.eventId === selectedEventId;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

    const query = searchQuery.toLowerCase().trim();
    const ev = eventMap.get(r.eventId);
    const matchesSearch =
      !query ||
      r.fullName.toLowerCase().includes(query) ||
      (r.rollNumber && r.rollNumber.toLowerCase().includes(query)) ||
      r.email.toLowerCase().includes(query) ||
      (r.phone && r.phone.toLowerCase().includes(query)) ||
      (r.ticketCode && r.ticketCode.toLowerCase().includes(query)) ||
      (r.department && r.department.toLowerCase().includes(query)) ||
      (ev && ev.title.toLowerCase().includes(query));

    return matchesEvent && matchesStatus && matchesSearch;
  });

  const confirmedCount = registrations.filter((r) => r.status === "CONFIRMED").length;
  const pendingCount = registrations.filter((r) => r.status === "PAYMENT_PENDING").length;
  const attendedCount = registrations.filter((r) => r.status === "ATTENDED").length;

  return (
    <AdminLayout>
      <div className="space-y-8 font-openSans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider">
              <ClipboardList size={16} /> Public Event Registrations
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
              Event Registrations Hub
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Live database of all attendees registered via public event pages, complete with student roll numbers, emails, phone numbers, and digital ticket codes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 shadow-xs transition-colors"
              title="Export all filtered registrations to Excel sheet"
            >
              <Download size={14} className="text-emerald-700" /> Export to Excel (.xlsx)
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-ieee-navy hover:bg-ieee-blue text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Add Registration
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm">
            <span className="text-xs uppercase font-bold text-gray-500 block mb-1">
              Total Registrations
            </span>
            <div className="text-2xl font-montserrat font-extrabold text-ieee-navy">
              {registrations.length}
            </div>
            <span className="text-[11px] text-gray-500 mt-1.5 block">
              Across all chapter events
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm">
            <span className="text-xs uppercase font-bold text-status-active block mb-1">
              Confirmed Seats
            </span>
            <div className="text-2xl font-montserrat font-extrabold text-[#00843D]">
              {confirmedCount}
            </div>
            <span className="text-[11px] text-[#00843D] mt-1.5 block">
              Digital tickets issued
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm">
            <span className="text-xs uppercase font-bold text-amber-600 block mb-1">
              Payment Pending
            </span>
            <div className="text-2xl font-montserrat font-extrabold text-amber-600">
              {pendingCount}
            </div>
            <span className="text-[11px] text-gray-500 mt-1.5 block">
              Awaiting treasurer review
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm">
            <span className="text-xs uppercase font-bold text-ieee-blue block mb-1">
              Checked-In / Attended
            </span>
            <div className="text-2xl font-montserrat font-extrabold text-ieee-blue">
              {attendedCount}
            </div>
            <span className="text-[11px] text-gray-500 mt-1.5 block">
              Verified on venue scanner
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Event Dropdown Filter */}
            <div className="w-full sm:w-64">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs font-montserrat font-bold text-ieee-navy bg-white focus:outline-none focus:ring-1 focus:ring-ieee-blue"
              >
                <option value="ALL">All Events ({registrations.length})</option>
                {events.map((ev) => {
                  const evRegs = registrations.filter((r) => r.eventId === ev.id).length;
                  return (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({evRegs})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "All Status" },
                { id: "CONFIRMED", label: "Confirmed" },
                { id: "PAYMENT_PENDING", label: "Pending" },
                { id: "ATTENDED", label: "Attended" },
                { id: "CANCELLED", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${
                    statusFilter === tab.id
                      ? "bg-ieee-navy text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, roll, email, ticket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
            />
          </div>
        </div>

        {/* Registrations Data Table */}
        <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <RefreshCw size={24} className="animate-spin text-ieee-blue mx-auto" />
              <p className="text-xs font-montserrat font-medium">Loading registered attendees...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-ieee-surfaceTint flex items-center justify-center mx-auto text-ieee-navy">
                <Ticket size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-sm text-gray-800">
                {searchQuery || selectedEventId !== "ALL"
                  ? "No matching registrations found"
                  : "No Event Registrations Received Yet"}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                When students fill out the registration form on any public event page, their full profile and ticket code will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 font-montserrat font-bold text-gray-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Student Information</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">Department & IEEE</th>
                    <th className="p-4">Ticket Code</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRegistrations.map((reg) => {
                    const ev = eventMap.get(reg.eventId);
                    return (
                      <tr key={reg.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-4">
                          <div className="font-montserrat font-bold text-ieee-navy text-sm">
                            {reg.fullName}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                            {reg.rollNumber && (
                              <span className="font-mono text-ieee-navy font-semibold bg-gray-100 px-1.5 py-0.5 rounded">
                                {reg.rollNumber}
                              </span>
                            )}
                            <span>{reg.email}</span>
                            {reg.phone && (
                              <>
                                <span>•</span>
                                <span>{reg.phone}</span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="p-4 max-w-xs">
                          <span className="font-semibold text-gray-800 block truncate">
                            {ev?.title || "UCET Event"}
                          </span>
                          {ev && (
                            <Link
                              href={`/events/${ev.slug}`}
                              target="_blank"
                              className="text-[11px] text-ieee-blue hover:underline inline-flex items-center gap-1"
                            >
                              View Event <ExternalLink size={10} />
                            </Link>
                          )}
                        </td>

                        <td className="p-4 text-gray-700">
                          <div>{reg.department || "Computer Science"}</div>
                          {reg.isIeeeMember ? (
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-ieee-blue bg-ieee-surfaceTint px-1.5 py-0.5 rounded">
                              IEEE Member {reg.ieeeMembershipNumber ? `(${reg.ieeeMembershipNumber})` : ""}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Non-Member</span>
                          )}
                        </td>

                        <td className="p-4">
                          {reg.ticketCode ? (
                            <button
                              onClick={() => handleCopyTicket(reg.ticketCode!)}
                              className="inline-flex items-center gap-1 font-mono font-bold text-xs text-ieee-navy bg-gray-100 hover:bg-ieee-surfaceTint px-2 py-1 rounded border border-gray-200 transition-colors"
                              title="Click to copy ticket code"
                            >
                              <span>{reg.ticketCode}</span>
                              {copiedTicket === reg.ticketCode ? (
                                <Check size={11} className="text-green-600" />
                              ) : (
                                <Copy size={11} className="text-gray-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-gray-400 italic">No Ticket</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-montserrat font-bold ${
                              reg.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : reg.status === "ATTENDED"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : reg.status === "PAYMENT_PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                reg.status === "CONFIRMED"
                                  ? "bg-emerald-500"
                                  : reg.status === "ATTENDED"
                                  ? "bg-blue-500"
                                  : reg.status === "PAYMENT_PENDING"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {reg.status}
                          </span>
                        </td>

                        <td className="p-4 text-gray-500 text-[11px] whitespace-nowrap">
                          {reg.createdAt ? formatPKTDateTime(reg.createdAt) : "Recent"}
                        </td>

                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Push to Attendance Button */}
                          <button
                            onClick={() => handlePushToAttendance(reg)}
                            disabled={pushingAttendanceId === reg.id}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ieee-navy hover:text-white bg-ieee-surfaceTint hover:bg-ieee-blue px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                            title="Add to Event Attendance Sheet for QR code generation"
                          >
                            <Users size={11} />
                            <span>Add to Attendance</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(reg)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-ieee-navy bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                            title="Edit student registration details"
                          >
                            <Edit2 size={11} /> Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteRegistration(reg)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                            title="Remove registration"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Registration Modal */}
        {editingReg && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                    <Edit2 size={16} className="text-ieee-blue" /> Edit Attendee Registration
                  </h3>
                  <span className="font-mono text-xs text-ieee-blue font-bold">{editingReg.ticketCode || "No Ticket"}</span>
                </div>
                <button onClick={() => !isSavingEdit && setEditingReg(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Roll / Student ID</label>
                    <input
                      type="text"
                      value={editRoll}
                      onChange={(e) => setEditRoll(e.target.value)}
                      placeholder="e.g. FA21-BCS-042"
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Registration Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-semibold"
                  >
                    <option value="CONFIRMED">CONFIRMED (Seat Confirmed)</option>
                    <option value="PAYMENT_PENDING">PAYMENT_PENDING (Awaiting Review)</option>
                    <option value="ATTENDED">ATTENDED (Checked-In)</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="edit-ieee"
                    checked={editIsIeee}
                    onChange={(e) => setEditIsIeee(e.target.checked)}
                    className="rounded text-ieee-blue"
                  />
                  <label htmlFor="edit-ieee" className="font-semibold text-gray-700 cursor-pointer">
                    IEEE Computer Society Member
                  </label>
                </div>

                {editIsIeee && (
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">IEEE Membership Number</label>
                    <input
                      type="text"
                      value={editIeeeNo}
                      onChange={(e) => setEditIeeeNo(e.target.value)}
                      placeholder="e.g. 98765432"
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={() => setEditingReg(null)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-2 bg-ieee-navy hover:bg-ieee-blue text-white font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Registration Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                  <Plus size={18} className="text-ieee-blue" /> Add Manual Event Registration
                </h3>
                <button onClick={() => !isAdding && setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Select Event *</label>
                  <select
                    value={addEventId}
                    onChange={(e) => setAddEventId(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-semibold"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roshan Ashraf"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Roll / Student ID</label>
                    <input
                      type="text"
                      placeholder="e.g. FA21-BCS-042"
                      value={addRoll}
                      onChange={(e) => setAddRoll(e.target.value)}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 03001234567"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@iub.edu.pk"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={addDept}
                    onChange={(e) => setAddDept(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Registration Status</label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-semibold"
                  >
                    <option value="CONFIRMED">CONFIRMED (Seat Confirmed)</option>
                    <option value="PAYMENT_PENDING">PAYMENT_PENDING (Awaiting Review)</option>
                    <option value="ATTENDED">ATTENDED (Checked-In)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="add-ieee"
                    checked={addIsIeee}
                    onChange={(e) => setAddIsIeee(e.target.checked)}
                    className="rounded text-ieee-blue"
                  />
                  <label htmlFor="add-ieee" className="font-semibold text-gray-700 cursor-pointer">
                    IEEE Computer Society Member
                  </label>
                </div>

                {addIsIeee && (
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">IEEE Membership Number</label>
                    <input
                      type="text"
                      value={addIeeeNo}
                      onChange={(e) => setAddIeeeNo(e.target.value)}
                      placeholder="e.g. 98765432"
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    disabled={isAdding}
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-4 py-2 bg-ieee-navy hover:bg-ieee-blue text-white font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isAdding ? "Registering..." : "Create Registration"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

