"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { checkInTicketAction } from "@/app/actions/operations";
import { Registration, EventItem, StaffUser } from "@/types";
import { Button } from "@/components/ui/Button";
import * as XLSX from "xlsx";
import {
  QrCode,
  Camera,
  CameraOff,
  SwitchCamera,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Clock,
  Users,
  Calendar,
  MapPin,
  Sparkles,
  RefreshCw,
  UserCheck,
  Check,
  ChevronRight,
  Filter,
  Volume2,
  VolumeX,
} from "lucide-react";

// Web Audio API Beep synthesizer (no external assets needed)
function playAudioFeedback(type: "SUCCESS" | "WARNING" | "ERROR") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "SUCCESS") {
      // Pleasant high double-beep
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === "WARNING") {
      // Amber warning tone for duplicate
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else {
      // Low error buzz
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn("Audio feedback error:", e);
  }
}

// Clean extracted ticket or certificate code from URLs
function cleanScannedCode(raw: string): string {
  let text = raw.trim();
  if (text.includes("/")) {
    const parts = text.split("/").filter(Boolean);
    text = parts[parts.length - 1] || text;
  }
  if (text.includes("?")) {
    text = text.split("?")[0];
  }
  return text.trim().toUpperCase();
}

export default function MobileCheckinPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  // Scanner State
  const [ticketInput, setTicketInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const html5QrCodeRef = useRef<any>(null);
  const scannerContainerId = "mobile-qr-reader";

  // Result & Alerts
  const [resultMsg, setResultMsg] = useState<{
    type: "SUCCESS" | "WARNING" | "ERROR";
    title: string;
    description: string;
    reg?: Registration;
  } | null>(null);

  // Sheet Operations State
  const [sheetUploadStatus, setSheetUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrImageInputRef = useRef<HTMLInputElement>(null);

  // Table Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ATTENDED" | "PENDING">("ALL");

  // Load events and registrations
  useEffect(() => {
    async function loadData() {
      const allEvents = await db.fetchEvents();
      setEvents(allEvents);
      if (allEvents.length > 0) {
        // Default to DigitalFest or first event
        const defaultEvt = allEvents.find((e) => e.id.includes("digitalfest")) || allEvents[0];
        setSelectedEventId(defaultEvt.id);
      }
      setRegistrations(db.getRegistrations());

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("ieee_cs_active_staff");
        if (saved) {
          try {
            setCurrentUser(JSON.parse(saved));
          } catch {}
        }
      }
    }
    loadData();

    return () => {
      stopCameraScanner();
    };
  }, []);

  // Cleanup scanner on unmount
  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Stop scanner error:", err);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start Camera QR Scanner
  const startCameraScanner = async () => {
    try {
      await stopCameraScanner();
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: cameraFacing },
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleProcessTicketCode(decodedText);
        },
        () => {
          // Ignore individual frame non-decodes
        }
      );
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera scanner start error:", err);
      alert("Unable to open camera. Please grant camera permissions or use manual entry/image upload.");
      setIsCameraActive(false);
    }
  };

  // Switch between front and back camera
  const handleToggleCameraFacing = async () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      await stopCameraScanner();
      setTimeout(() => {
        startCameraScanner();
      }, 200);
    }
  };

  // Scan QR from an image file
  const handleScanFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const tempId = "temp-qr-file-container";
      let container = document.getElementById(tempId);
      if (!container) {
        container = document.createElement("div");
        container.id = tempId;
        container.style.display = "none";
        document.body.appendChild(container);
      }

      const fileScanner = new Html5Qrcode(tempId);
      const decodedText = await fileScanner.scanFile(file, true);
      handleProcessTicketCode(decodedText);
      fileScanner.clear();
    } catch (err) {
      alert("No valid QR code was detected in the selected image.");
    }
  };

  // Process ticket code from QR or text entry via atomic database RPC
  const handleProcessTicketCode = async (rawCode: string) => {
    const cleanCode = cleanScannedCode(rawCode);
    if (!cleanCode) return;

    try {
      const res = await checkInTicketAction(cleanCode);

      if (res.success) {
        if (soundEnabled) playAudioFeedback("SUCCESS");
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(100);

        setResultMsg({
          type: "SUCCESS",
          title: "Check-in Successful!",
          description: `Verified ${res.fullName || "Attendee"} (${res.rollNumber || "Participant"}). Entry wristband issued.`,
        });

        setTicketInput("");
        const live = await db.fetchRegistrations();
        setRegistrations(live);
        return;
      }

      // Handle specific database rejection reasons
      if (res.error === "ALREADY_CHECKED_IN") {
        if (soundEnabled) playAudioFeedback("WARNING");
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 60, 100]);
        setResultMsg({
          type: "WARNING",
          title: "Duplicate Check-in Alert!",
          description: `${res.fullName} was ALREADY checked in. Duplicate badge denied.`,
        });
        return;
      }

      if (res.error === "UNPAID") {
        if (soundEnabled) playAudioFeedback("ERROR");
        setResultMsg({
          type: "ERROR",
          title: "Registration Unpaid / Pending",
          description: `${res.fullName}: Payment verification is pending with Chapter Treasurer.`,
        });
        return;
      }

      // Other error / not found
      if (soundEnabled) playAudioFeedback("ERROR");
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([180, 80, 180]);
      setResultMsg({
        type: "ERROR",
        title: "Ticket Check-in Denied",
        description: res.error || `Ticket "${cleanCode}" could not be checked in.`,
      });
    } catch (err: any) {
      if (soundEnabled) playAudioFeedback("ERROR");
      setResultMsg({
        type: "ERROR",
        title: "Database Error",
        description: err.message || "Could not connect to database for check-in verification.",
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      handleProcessTicketCode(ticketInput.trim());
    }
  };

  // Manual Toggle Attendance Button in list
  const handleToggleStatus = (regId: string) => {
    const allRegs = db.getRegistrations();
    const target = allRegs.find((r) => r.id === regId);
    if (!target) return;

    if (target.status === "ATTENDED") {
      target.status = "CONFIRMED";
      target.checkedInAt = undefined;
    } else {
      target.status = "ATTENDED";
      target.checkedInAt = new Date().toISOString();
      if (soundEnabled) playAudioFeedback("SUCCESS");
    }

    db.saveRegistrations(allRegs);
    setRegistrations([...allRegs]);
  };

  // Upload Attendance Sheet (Excel & CSV)
  const handleUploadAttendanceSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetEventId = selectedEventId === "ALL" ? events[0]?.id || "evt-digitalfest-2026" : selectedEventId;
    const targetEvent = events.find((ev) => ev.id === targetEventId);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (rows.length === 0) {
        alert("The uploaded attendance spreadsheet contains no rows.");
        return;
      }

      const allRegs = db.getRegistrations();
      let matchedCount = 0;
      let newCount = 0;

      rows.forEach((row, idx) => {
        // Auto-detect columns
        const name = String(row["Name"] || row["Full Name"] || row["Student Name"] || row["Participant"] || "").trim();
        const roll = String(row["Roll Number"] || row["Roll No"] || row["Reg No"] || row["Seat No"] || "").trim();
        const email = String(row["Email"] || row["Email Address"] || "").trim();
        const dept = String(row["Department"] || row["Dept"] || "Department of Information & Communication Engineering, IUB").trim();
        const ticket = String(row["Ticket Code"] || row["Ticket"] || row["Code"] || "").trim();
        const statusRaw = String(row["Status"] || row["Attended"] || row["Attendance"] || "ATTENDED").toUpperCase();

        const isAttended =
          statusRaw.includes("ATTEND") ||
          statusRaw.includes("PRESENT") ||
          statusRaw.includes("YES") ||
          statusRaw.includes("1") ||
          statusRaw.includes("TRUE");

        // Try to match existing registration
        const existing = allRegs.find(
          (r) =>
            (ticket && r.ticketCode?.toUpperCase() === ticket.toUpperCase()) ||
            (roll && r.rollNumber?.toLowerCase() === roll.toLowerCase()) ||
            (name && r.fullName.toLowerCase() === name.toLowerCase() && r.eventId === targetEventId)
        );

        if (existing) {
          matchedCount++;
          if (isAttended) {
            existing.status = "ATTENDED";
            existing.checkedInAt = existing.checkedInAt || new Date().toISOString();
          }
        } else if (name) {
          newCount++;
          allRegs.unshift({
            id: `reg-imported-${Date.now()}-${idx}`,
            eventId: targetEventId,
            privateToken: `token-${Date.now()}-${idx}`,
            fullName: name,
            namePreference: "FULL_NAME",
            email: email || `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@iub.edu.pk`,
            rollNumber: roll || "Enrolled Student",
            department: dept,
            isIeeeMember: false,
            photoConsent: true,
            status: isAttended ? "ATTENDED" : "CONFIRMED",
            ticketCode: ticket || `TCK-IMP-${String(1000 + idx)}`,
            checkedInAt: isAttended ? new Date().toISOString() : undefined,
            createdAt: new Date().toISOString(),
          });
        }
      });

      db.saveRegistrations(allRegs);
      setRegistrations([...allRegs]);

      const successMsg = `Successfully processed "${file.name}" for "${targetEvent?.title || "Event"}": ${matchedCount} matched attendees marked, ${newCount} new participants imported.`;
      setSheetUploadStatus(successMsg);
      setTimeout(() => setSheetUploadStatus(null), 5000);

      db.addAuditLog(
        currentUser?.name || "Admin",
        "ATTENDANCE_SHEET_IMPORTED",
        "events",
        targetEventId,
        successMsg
      );
    } catch (err: any) {
      console.error("Sheet parse error:", err);
      alert("Failed to parse sheet: " + err.message);
    }
  };

  // Export Attendance Sheet (Excel or CSV)
  const handleExportSheet = (format: "XLSX" | "CSV") => {
    const targetEvent = events.find((e) => e.id === selectedEventId);
    const activeList = selectedEventId === "ALL" ? registrations : registrations.filter((r) => r.eventId === selectedEventId);

    const exportRows = activeList.map((r, idx) => ({
      "Sr.": idx + 1,
      "Full Name": r.fullName,
      "Roll Number / Team": r.rollNumber || "N/A",
      "Department": r.department || "UCET",
      "Email Address": r.email,
      "Ticket Code": r.ticketCode || "N/A",
      "Attendance Status": r.status === "ATTENDED" ? "PRESENT (ATTENDED)" : "PENDING (NOT CHECKED IN)",
      "Check-in Timestamp (PKT)": r.checkedInAt ? new Date(r.checkedInAt).toLocaleString("en-PK") : "N/A",
      "IEEE Member": r.isIeeeMember ? "Yes" : "No",
      "Event Title": events.find((e) => e.id === r.eventId)?.title || "IEEE CS UCET IUB Event",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const slug = targetEvent?.slug.replace(/\//g, "-") || "event-attendance";
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === "XLSX") {
      XLSX.writeFile(workbook, `${slug}_Attendance_Sheet_${dateStr}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `${slug}_Attendance_Sheet_${dateStr}.csv`);
    }
  };

  // Filtered List Computation
  const currentEvent = events.find((e) => e.id === selectedEventId);
  const eventScopedList = selectedEventId === "ALL" ? registrations : registrations.filter((r) => r.eventId === selectedEventId);

  const totalRegisteredCount = eventScopedList.length;
  const attendedCount = eventScopedList.filter((r) => r.status === "ATTENDED").length;
  const pendingCount = totalRegisteredCount - attendedCount;
  const attendanceRate = totalRegisteredCount > 0 ? Math.round((attendedCount / totalRegisteredCount) * 100) : 0;

  const displayList = eventScopedList.filter((r) => {
    const matchesFilter =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ATTENDED"
        ? r.status === "ATTENDED"
        : r.status !== "ATTENDED";

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.rollNumber.toLowerCase().includes(q) ||
      r.ticketCode?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-montserrat font-bold text-ieee-orange uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                On-Site Entrance Operations
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-xs text-gray-500 hover:text-ieee-blue flex items-center gap-1"
                title={soundEnabled ? "Mute scanner audio feedback" : "Enable scanner audio feedback"}
              >
                {soundEnabled ? <Volume2 size={14} className="text-emerald-600" /> : <VolumeX size={14} />}
                <span className="text-[11px]">{soundEnabled ? "Audio On" : "Audio Muted"}</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
              Mobile QR Ticket Check-in Scanner
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Real-time camera barcode scanner, live event attendance categorization, and bulk Excel/CSV sheet manager.
            </p>
          </div>

          {/* Quick Demo Pre-filled Links */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 text-[11px]">Quick Test:</span>
            <button
              type="button"
              onClick={() => handleProcessTicketCode("TCK-DF26-0001")}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-ieee-navy font-mono text-[11px] rounded border transition-colors"
            >
              ByteForge Leader
            </button>
            <button
              type="button"
              onClick={() => handleProcessTicketCode("TCK-DF26-0002")}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-ieee-navy font-mono text-[11px] rounded border transition-colors"
            >
              Meta Hunters
            </button>
          </div>
        </div>

        {/* 1. Categorized by Event Bar */}
        <div className="bg-white border border-gray-200 rounded-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Select Active Event (Categorized Roster):
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-ieee-navy bg-white focus:outline-none focus:border-ieee-blue"
              >
                <option value="ALL">🌐 All Events (Cross-Event Scanner)</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Event Metadata */}
            {currentEvent && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 pt-2 md:pt-4">
                <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded">
                  <Calendar size={13} className="text-ieee-blue" />
                  {new Date(currentEvent.startDate).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded truncate max-w-xs">
                  <MapPin size={13} className="text-ieee-orange" />
                  {currentEvent.venue}
                </span>
              </div>
            )}
          </div>

          {/* Stats Progress Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Attendees</span>
              <span className="text-xl font-montserrat font-bold text-gray-800">{totalRegisteredCount}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Checked In (Present)</span>
              <span className="text-xl font-montserrat font-bold text-emerald-800">{attendedCount}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">Pending Check-in</span>
              <span className="text-xl font-montserrat font-bold text-amber-800">{pendingCount}</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <span className="text-[10px] font-bold text-ieee-blue uppercase block">Turnout Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-montserrat font-bold text-ieee-navy">{attendanceRate}%</span>
                <span className="text-[10px] text-gray-500 font-semibold">of hall capacity</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Attendance Sheet Excel & CSV Hub */}
        <div className="bg-gradient-to-r from-blue-50/70 via-white to-amber-50/40 border border-blue-200 rounded-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-sm text-ieee-navy">
                  Attendance Sheet Excel & CSV Operations
                </h3>
                <p className="text-xs text-gray-500">
                  Bulk upload an Excel/CSV attendance sheet or export verified rosters for{" "}
                  <strong>{currentEvent?.title || "Selected Event"}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Upload Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleUploadAttendanceSheet}
              />
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 flex items-center gap-1.5 text-xs shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> Upload Sheet (Excel / CSV)
              </Button>

              {/* Export Buttons */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={() => handleExportSheet("XLSX")}
              >
                <Download size={13} className="text-emerald-600" /> Export Excel (.xlsx)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={() => handleExportSheet("CSV")}
              >
                <Download size={13} className="text-ieee-blue" /> Export CSV (.csv)
              </Button>
            </div>
          </div>

          {sheetUploadStatus && (
            <div className="p-3 bg-emerald-100/80 border border-emerald-300 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0" />
              <span>{sheetUploadStatus}</span>
            </div>
          )}
        </div>

        {/* 3. Main Scanner & Verification Station */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Camera QR Viewfinder & Manual Input (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-montserrat font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Camera size={15} className="text-ieee-blue" />
                  Live Camera QR Scanner
                </span>

                <div className="flex items-center gap-2">
                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={handleToggleCameraFacing}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700 flex items-center gap-1 transition-colors"
                      title="Flip camera front/back"
                    >
                      <SwitchCamera size={13} />
                      <span className="text-[11px] capitalize">{cameraFacing}</span>
                    </button>
                  )}

                  <input
                    ref={qrImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleScanFromImage}
                  />
                  <button
                    type="button"
                    onClick={() => qrImageInputRef.current?.click()}
                    className="text-xs text-ieee-blue hover:underline flex items-center gap-1"
                    title="Upload QR photo from gallery"
                  >
                    <Upload size={12} /> Scan Image
                  </button>
                </div>
              </div>

              {/* Camera Scanner Viewport */}
              <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden bg-gray-950 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <div id={scannerContainerId} className="w-full h-full" />

                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gradient-to-b from-gray-900/90 to-gray-950/95 text-white">
                    <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <QrCode size={28} />
                    </div>
                    <div>
                      <h4 className="font-montserrat font-bold text-sm text-white">Camera Scanner Ready</h4>
                      <p className="text-xs text-gray-400 max-w-xs mt-1">
                        Tap below to start your device camera for instant barcode & QR verification at entrance.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={startCameraScanner}
                      className="flex items-center gap-1.5 bg-ieee-blue hover:bg-blue-700 text-xs px-4 py-2"
                    >
                      <Camera size={14} /> Start Camera Scanner
                    </Button>
                  </div>
                )}

                {isCameraActive && (
                  <div className="absolute bottom-3 inset-x-0 flex justify-center">
                    <button
                      type="button"
                      onClick={stopCameraScanner}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg transition-colors"
                    >
                      <CameraOff size={13} /> Pause Scanner
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Ticket Input */}
              <form onSubmit={handleManualSubmit} className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase">
                  Manual Code Search / USB Scanner:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <QrCode size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. TCK-DF26-0001 or CSIUB-26-DF01"
                      value={ticketInput}
                      onChange={(e) => setTicketInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-wider uppercase border border-gray-300 rounded-lg focus:outline-none focus:border-ieee-blue"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm" className="px-4">
                    Verify
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Active Scan Result Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm space-y-4 h-full flex flex-col justify-between">
              <div>
                <span className="font-montserrat font-bold text-xs uppercase tracking-wider text-gray-700 block mb-3">
                  Scan Verification Status
                </span>

                {/* Banner */}
                {resultMsg ? (
                  <div
                    className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                      resultMsg.type === "SUCCESS"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : resultMsg.type === "WARNING"
                        ? "bg-amber-50 border-amber-300 text-amber-900"
                        : "bg-red-50 border-red-300 text-red-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {resultMsg.type === "SUCCESS" && <CheckCircle2 size={22} className="text-emerald-600" />}
                      {resultMsg.type === "WARNING" && <AlertTriangle size={22} className="text-amber-600" />}
                      {resultMsg.type === "ERROR" && <XCircle size={22} className="text-red-600" />}
                      <span className="font-montserrat font-bold text-sm">{resultMsg.title}</span>
                    </div>

                    <p className="text-xs leading-relaxed">{resultMsg.description}</p>

                    {resultMsg.reg && (
                      <div className="p-3 bg-white/80 rounded-lg border border-gray-200/80 space-y-1.5 text-xs text-gray-800 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Attendee:</span>
                          <span className="font-bold">{resultMsg.reg.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Roll Number:</span>
                          <span className="font-mono">{resultMsg.reg.rollNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Department:</span>
                          <span className="truncate max-w-[170px]">{resultMsg.reg.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ticket Code:</span>
                          <span className="font-mono font-bold text-ieee-blue">{resultMsg.reg.ticketCode}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl space-y-2 text-gray-400">
                    <QrCode size={36} className="mx-auto text-gray-300" />
                    <p className="text-xs font-semibold">Awaiting QR scan or ticket code</p>
                    <p className="text-[11px]">Scan participant badge with camera or type code to verify eligibility.</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-500 space-y-1">
                <span className="font-bold text-gray-700 block">Entrance Checklist:</span>
                <p>• Verify candidate face with photo ID card if requested.</p>
                <p>• Hand over official conference wristband or expo name badge upon successful green scan.</p>
                <p>• If duplicate amber alert sounds, verify with student council supervisor.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Live Attendees Roster for Event */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                <Users size={18} className="text-ieee-blue" />
                Live Attendance Directory ({displayList.length})
              </h3>
              <p className="text-xs text-gray-500">
                Categorized by: <strong>{currentEvent?.title || "All Events"}</strong>
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === "ALL" ? "bg-white text-ieee-navy shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({eventScopedList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ATTENDED")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === "ATTENDED"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Present ({attendedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === "PENDING"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pending ({pendingCount})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              placeholder="Search by student name, roll number, department, ticket code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-ieee-blue"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px] tracking-wider bg-gray-50">
                  <th className="py-2.5 px-3">Participant</th>
                  <th className="py-2.5 px-3">Roll / Semester</th>
                  <th className="py-2.5 px-3">Ticket Code</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400 italic">
                      No attendees found matching filter.
                    </td>
                  </tr>
                ) : (
                  displayList.slice(0, 100).map((r) => {
                    const isAttended = r.status === "ATTENDED";
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-gray-900 block">{r.fullName}</span>
                          <span className="text-[11px] text-gray-400">{r.email}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 font-medium">
                          {r.rollNumber || "N/A"}
                          <span className="text-[10px] text-gray-400 block truncate max-w-xs">{r.department}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-ieee-blue">
                          {r.ticketCode || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          {isAttended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={11} /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                              <Clock size={11} /> Pending
                            </span>
                          )}
                          {r.checkedInAt && (
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {new Date(r.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(r.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                              isAttended
                                ? "text-gray-500 hover:text-red-600 border border-gray-300 hover:bg-red-50"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            }`}
                          >
                            {isAttended ? "Undo Check-in" : "Check In"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {displayList.length > 100 && (
            <p className="text-[11px] text-gray-400 text-center pt-2">
              Showing first 100 of {displayList.length} attendees. Use search above to narrow results.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
