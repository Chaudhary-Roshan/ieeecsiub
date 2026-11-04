"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { EventItem, AttendanceRecord, CertificateRecord } from "@/types";
import { generateCertificateCode, generateQrPngDataUrl } from "@/lib/codeGenerator";
import { saveEventAction } from "@/app/actions/events";
import { Button } from "@/components/ui/Button";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  Users,
  FileSpreadsheet,
  Upload,
  Download,
  FileCheck2,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Trash2,
  Plus,
  Copy,
  Check,
  Eye,
  Edit2,
  FileDown,
  QrCode,
  ExternalLink,
  X,
} from "lucide-react";

function cleanStr(s: any): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatExtractedValue(val: any, type?: "text" | "phone" | "email" | "roll"): string {
  if (val === undefined || val === null) return "";
  let s = String(val).trim();
  if (typeof val === "number" && !isNaN(val)) {
    s = val.toLocaleString("fullwide", { useGrouping: false });
  }

  if (type === "phone") {
    let digits = s.replace(/[^\d]/g, "");
    if (digits.startsWith("923") && digits.length === 12) {
      digits = "0" + digits.slice(2);
    } else if (digits.startsWith("00923") && digits.length === 14) {
      digits = "0" + digits.slice(4);
    } else if (digits.startsWith("3") && digits.length === 10) {
      digits = "0" + digits;
    }
    if (digits.length === 11 && digits.startsWith("03")) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    return digits || s;
  }

  if (type === "roll") {
    if (s.toLowerCase() === "n/a" || s.toLowerCase() === "none" || s.toLowerCase() === "null") return "";
    return s.toUpperCase();
  }

  if (type === "email") {
    return s.toLowerCase();
  }

  return s;
}

function extractFieldFromRow(row: any, aliases: string[], type?: "text" | "phone" | "email" | "roll"): string {
  if (!row || typeof row !== "object") return "";
  const keys = Object.keys(row);

  // 1. Direct exact key match
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== "") {
      return formatExtractedValue(row[alias], type);
    }
  }

  // 2. Normalized alphanumeric match
  const normAliases = aliases.map(cleanStr);
  for (const k of keys) {
    const normK = cleanStr(k);
    if (normAliases.includes(normK)) {
      const val = row[k];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return formatExtractedValue(val, type);
      }
    }
  }

  // 3. Substring & question header match
  for (const k of keys) {
    const normK = cleanStr(k);
    for (const alias of aliases) {
      const normAlias = cleanStr(alias);
      if (normAlias.length >= 3 && normK.includes(normAlias)) {
        const val = row[k];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return formatExtractedValue(val, type);
        }
      }
    }
  }

  // 4. Value-pattern fallback
  if (type === "roll") {
    for (const k of keys) {
      const normK = cleanStr(k);
      if (normK.includes("name") || normK.includes("email") || normK.includes("phone") || normK.includes("time") || normK.includes("date")) continue;
      const val = String(row[k] || "").trim();
      if (/^[SFsf]\d{2}[A-Za-z0-9]{4,14}$/i.test(val) || /^[A-Za-z0-9]{1,6}[-\/][A-Za-z0-9]{1,6}[-\/][A-Za-z0-9]{1,6}$/i.test(val) || /^[A-Za-z]{1,4}\d{2}[A-Za-z0-9\-]+$/i.test(val)) {
        return formatExtractedValue(val, "roll");
      }
    }
  }

  if (type === "email") {
    for (const k of keys) {
      const val = row[k];
      if (!val) continue;
      const strVal = String(val).trim();
      if (strVal.includes("@") && strVal.includes(".")) {
        return formatExtractedValue(strVal, "email");
      }
    }
  }

  return "";
}

export default function AdminAttendancePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [filterMode, setFilterMode] = useState<"ALL" | "ATTENDED" | "ABSENT" | "ISSUED" | "PENDING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeneratingPdfs, setIsGeneratingPdfs] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [isGeneratingInApp, setIsGeneratingInApp] = useState(false);
  const [inAppProgress, setInAppProgress] = useState("");

  // Granular Wipe State
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeScope, setWipeScope] = useState<"ALL" | "ATTENDANCE_ONLY" | "CODES_ONLY">("ALL");

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Add Attendee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAttendeeName, setNewAttendeeName] = useState("");
  const [newAttendeeRoll, setNewAttendeeRoll] = useState("");
  const [newAttendeeEmail, setNewAttendeeEmail] = useState("");
  const [newAttendeeAttended, setNewAttendeeAttended] = useState(true);

  // Edit Attendee Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // QR Code Preview Modal State
  const [previewQrRecord, setPreviewQrRecord] = useState<{ name: string; roll: string; code: string; qrDataUrl: string } | null>(null);

  // Copy Feedback State
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const allEvents = await db.fetchEvents();
      setEvents(allEvents);
      if (allEvents.length > 0) {
        const defaultId = allEvents[0].id;
        setSelectedEventId(defaultId);
        loadAttendance(defaultId);
      }
    }
    init();
  }, []);

  const loadAttendance = (eventId: string) => {
    const records = db.getAttendance(eventId);
    setAttendanceList(records);
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    loadAttendance(eventId);
  };

  const handleToggleAttendance = (recordId: string) => {
    const updated = db.toggleAttendance(selectedEventId, recordId);
    setAttendanceList([...updated]);
  };

  // Upload Excel or CSV file with idempotent permanent certificate codes
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;

    try {
      const currentEvent = events.find((ev) => ev.id === selectedEventId);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonRows.length === 0) {
        alert("The uploaded spreadsheet is empty.");
        return;
      }

      // Fetch all existing certificates and current attendance to ensure idempotent permanent codes
      await db.fetchCertificates();
      const allCerts = db.getCertificates();
      const existingAttendance = db.getAttendance(selectedEventId);

      const codeByName = new Map<string, string>();
      const codeByRoll = new Map<string, string>();
      const codeByEmail = new Map<string, string>();

      // 1. Index all permanently issued certificates
      allCerts.forEach((c) => {
        if (c.code) {
          const cCode = c.code.trim();
          if (c.recipientName) codeByName.set(c.recipientName.trim().toLowerCase(), cCode);
        }
      });

      // 2. Index existing attendance records for this event
      existingAttendance.forEach((a) => {
        if (a.certificateCode) {
          const aCode = a.certificateCode.trim();
          if (a.name) codeByName.set(a.name.trim().toLowerCase(), aCode);
          if (a.rollNumber) codeByRoll.set(a.rollNumber.trim().toLowerCase(), aCode);
          if (a.email) codeByEmail.set(a.email.trim().toLowerCase(), aCode);
        }
      });

      let preservedCount = 0;
      let newlyIssuedCount = 0;

      const processedRecords: AttendanceRecord[] = [];
      const newCertificates: CertificateRecord[] = [];

      for (let idx = 0; idx < jsonRows.length; idx++) {
        const row = jsonRows[idx];

        // 1. Ultra-robust fuzzy column extraction
        const name = extractFieldFromRow(row, [
          "Full Name", "Student Name", "Participant Name", "Name", "Student", "Attendee", "Attendee Name", "Participant"
        ], "text") || `Participant ${idx + 1}`;

        const rollNumber = extractFieldFromRow(row, [
          "Roll Number", "Roll No", "Roll No.", "Roll_No", "Registration No", "Reg No", "Reg No.", "Reg_No",
          "Registration", "Roll", "Reg", "ID", "Student ID", "RollNumber", "RegNumber", "Roll_Number"
        ], "roll");

        const email = extractFieldFromRow(row, [
          "Email Address", "Email", "Gmail", "E-mail", "Student Email", "Mail", "Email / Gmail", "E-Mail Address",
          "Contact Email", "EmailAddress", "G-Mail"
        ], "email");

        const attendedRaw = extractFieldFromRow(row, [
          "Attended", "Attendance", "Status", "Present", "Attended?"
        ]).toLowerCase();

        const attended = !attendedRaw || attendedRaw.includes("yes") || attendedRaw.includes("present") || attendedRaw.includes("1") || attendedRaw.includes("true");

        const normName = name.toLowerCase();
        const normRoll = rollNumber.toLowerCase();
        const normEmail = email.toLowerCase();

        // 2. Multi-key idempotency lookup: Match existing code by Roll Number, Email, OR Name
        let assignedCode: string | undefined = undefined;
        if (normRoll && codeByRoll.has(normRoll)) {
          assignedCode = codeByRoll.get(normRoll);
        } else if (normEmail && codeByEmail.has(normEmail)) {
          assignedCode = codeByEmail.get(normEmail);
        } else if (normName && codeByName.has(normName)) {
          assignedCode = codeByName.get(normName);
        }

        if (attended) {
          if (assignedCode) {
            // Existing participant: KEEP THEIR EXACT PREVIOUS CODE!
            preservedCount++;
          } else {
            // New participant: Generate brand new permanent code!
            assignedCode = generateCertificateCode("26");
            newlyIssuedCount++;

            // Register in lookup maps to avoid duplicates within same file
            if (normName) codeByName.set(normName, assignedCode);
            if (normRoll) codeByRoll.set(normRoll, assignedCode);
            if (normEmail) codeByEmail.set(normEmail, assignedCode);
          }

          // Permanently record/upsert the verification record in DB with full roll number and email
          const certRecord: CertificateRecord = {
            id: `cert-${Date.now()}-${idx}`,
            code: assignedCode,
            recipientName: name,
            recipientRollNumber: rollNumber || undefined,
            recipientEmail: email || undefined,
            publicNameFormat: "FULL_NAME",
            eventId: selectedEventId,
            eventTitle: currentEvent?.title || "UCET IUB Technical Event",
            certificateType: currentEvent?.certificateType || "Certificate of Participation",
            recognitionLevel: "CHAPTER_RECOGNITION",
            issuerStatement: "In recognition of active participation and successful completion.",
            activityDate: currentEvent?.startDate ? currentEvent.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            issueDate: new Date().toISOString().slice(0, 10),
            approverName: "Muhammad Roshan Ashraf",
            approverRole: "Chapter Chair",
            status: "ACTIVE",
            source: "IN_SITE_GENERATED",
            createdAt: new Date().toISOString(),
          };
          newCertificates.push(certRecord);
        }

        processedRecords.push({
          id: `att-${Date.now()}-${idx}`,
          eventId: selectedEventId,
          name,
          rollNumber,
          email,
          attended,
          certificateCode: attended ? assignedCode : undefined,
          checkedInAt: attended ? new Date().toISOString() : undefined,
        });
      }

      // Fast atomic bulk upsert to database with roll numbers and emails
      if (newCertificates.length > 0) {
        await db.addCertificatesBulk(newCertificates);
      }

      // Merge new records with any prior attendees who were not present in the new sheet
      const mergedList: AttendanceRecord[] = [...processedRecords];
      existingAttendance.forEach((oldRec) => {
        const alreadyIn = processedRecords.some(
          (p) =>
            (p.rollNumber && oldRec.rollNumber && p.rollNumber.toLowerCase() === oldRec.rollNumber.toLowerCase()) ||
            (p.email && oldRec.email && p.email.toLowerCase() === oldRec.email.toLowerCase()) ||
            (p.name && oldRec.name && p.name.toLowerCase() === oldRec.name.toLowerCase())
        );
        if (!alreadyIn) {
          mergedList.push(oldRec);
        }
      });

      db.saveAttendance(selectedEventId, mergedList);
      setAttendanceList(mergedList);

      alert(
        `Attendance Processed Successfully!\n\n` +
        `• Total Rows in File: ${jsonRows.length}\n` +
        `• Roll Numbers & Emails: Successfully Parsed & Stored\n` +
        `• Existing Codes Preserved: ${preservedCount} (codes remain permanent)\n` +
        `• New Verification Codes Issued: ${newlyIssuedCount}\n` +
        `• Total Event Attendees: ${mergedList.length}`
      );

      db.addAuditLog(
        "Muhammad Roshan Ashraf",
        "ATTENDANCE_IMPORTED",
        "events",
        selectedEventId,
        `Imported ${jsonRows.length} attendees (${preservedCount} preserved, ${newlyIssuedCount} new issued) from ${file.name}.`
      );
    } catch (err: any) {
      console.error(err);
      alert("Failed to read the file: " + (err?.message || "Invalid file format."));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearEventData = async () => {
    setIsWipeModalOpen(true);
  };

  const executeGranularWipe = async () => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    const eventName = currentEvent?.title || "this event";

    setIsWipeModalOpen(false);

    try {
      if (wipeScope === "ATTENDANCE_ONLY") {
        db.clearEventAttendanceOnly(selectedEventId, currentEvent?.title);
        setAttendanceList([]);
        alert(`Attendance records for "${eventName}" have been wiped. Existing QR / Verification codes remain preserved.`);
      } else if (wipeScope === "CODES_ONLY") {
        await db.clearEventCredentialsOnly(selectedEventId, currentEvent?.title);
        // Refresh attendance list so code column is cleared
        const updated = db.getAttendance(selectedEventId);
        setAttendanceList(updated);
        alert(`All QR and verification codes for "${eventName}" have been deleted/revoked. You can now generate fresh codes.`);
      } else {
        await db.clearEventAttendanceAndCertificates(selectedEventId, currentEvent?.title);
        setAttendanceList([]);
        alert(`All attendance records and verification codes for "${eventName}" have been completely wiped!`);
      }
    } catch (err: any) {
      alert("Failed to clear data: " + err.message);
    }
  };

  // Download Sample Template for Administrators
  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        "Full Name": "Muhammad Roshan Ashraf",
        "Roll Number": "S23BINCE1M40414",
        "Email": "ieeecsiub.contact@gmail.com",
        "Attended": "Yes",
      },
      {
        "Full Name": "Ali Ahmed",
        "Roll Number": "F22BCSE1M01015",
        "Email": "ali.ahmed@example.com",
        "Attended": "Yes",
      },
      {
        "Full Name": "Fatima Noor",
        "Roll Number": "S23BITE1M40089",
        "Email": "fatima.noor@example.com",
        "Attended": "No",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample_Attendance");
    XLSX.writeFile(workbook, "IEEE_Attendance_Sample_Template.xlsx");
  };

  // Export Attendance with Direct Verification Links (.xlsx)
  const handleExportLinksExcel = () => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent || attendanceList.length === 0) {
      alert("No attendance records to export.");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";

    const exportData = attendanceList.map((rec) => {
      const code = rec.certificateCode || "";
      const verifyUrl = code ? `${origin}/verify/${code}` : "N/A";
      return {
        "Full Name": rec.name,
        "Roll Number": rec.rollNumber || "N/A",
        "Email": rec.email || "N/A",
        "Attended Status": rec.attended ? "Present" : "Absent",
        "Verification Code": code || "Not Issued",
        "Direct Verification Link": verifyUrl,
        "Timestamp": rec.checkedInAt ? new Date(rec.checkedInAt).toLocaleString() : "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Verification_Roster");

    const safeTitle = currentEvent.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    XLSX.writeFile(workbook, `Verification_Roster_${safeTitle}.xlsx`);
  };

  // In-App QR & Verification Code Generator (Synchronizes with Supabase DB)
  const handleGenerateInApp = async (targetIds?: string[]) => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent) return;

    const recordsToProcess = targetIds && targetIds.length > 0
      ? attendanceList.filter((r) => targetIds.includes(r.id))
      : attendanceList.filter((r) => r.attended);

    if (recordsToProcess.length === 0) {
      alert("No eligible attendees to generate codes for. Please mark attendees as 'Present' first.");
      return;
    }

    setIsGeneratingInApp(true);
    setInAppProgress("Querying existing database credentials...");

    try {
      await db.fetchCertificates();
      const allCerts = db.getCertificates();

      const codeByName = new Map<string, string>();
      const codeByRoll = new Map<string, string>();
      const codeByEmail = new Map<string, string>();

      allCerts.forEach((c) => {
        if (c.code) {
          const cCode = c.code.trim();
          if (c.recipientName) codeByName.set(c.recipientName.trim().toLowerCase(), cCode);
          if (c.recipientRollNumber) codeByRoll.set(c.recipientRollNumber.trim().toLowerCase(), cCode);
          if (c.recipientEmail) codeByEmail.set(c.recipientEmail.trim().toLowerCase(), cCode);
        }
      });

      const newCertificates: CertificateRecord[] = [];
      let preservedCount = 0;
      let newlyIssuedCount = 0;

      const updatedList = attendanceList.map((rec) => {
        const isTarget = targetIds && targetIds.length > 0 ? targetIds.includes(rec.id) : rec.attended;
        if (!isTarget) return rec;

        const normName = rec.name.trim().toLowerCase();
        const normRoll = (rec.rollNumber || "").trim().toLowerCase();
        const normEmail = (rec.email || "").trim().toLowerCase();

        let assignedCode = rec.certificateCode;
        if (!assignedCode) {
          if (normRoll && codeByRoll.has(normRoll)) assignedCode = codeByRoll.get(normRoll);
          else if (normEmail && codeByEmail.has(normEmail)) assignedCode = codeByEmail.get(normEmail);
          else if (normName && codeByName.has(normName)) assignedCode = codeByName.get(normName);
        }

        if (assignedCode) {
          preservedCount++;
        } else {
          assignedCode = generateCertificateCode("26");
          newlyIssuedCount++;
          if (normName) codeByName.set(normName, assignedCode);
          if (normRoll) codeByRoll.set(normRoll, assignedCode);
          if (normEmail) codeByEmail.set(normEmail, assignedCode);
        }

        newCertificates.push({
          id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: assignedCode,
          recipientName: rec.name,
          recipientRollNumber: rec.rollNumber || undefined,
          recipientEmail: rec.email || undefined,
          publicNameFormat: "FULL_NAME",
          eventId: selectedEventId,
          eventTitle: currentEvent.title,
          certificateType: currentEvent.certificateType || "Certificate of Participation",
          recognitionLevel: "CHAPTER_RECOGNITION",
          issuerStatement: "In recognition of active participation and successful completion.",
          activityDate: currentEvent.startDate ? currentEvent.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
          issueDate: new Date().toISOString().slice(0, 10),
          approverName: "Muhammad Roshan Ashraf",
          approverRole: "Chapter Chair",
          status: "ACTIVE",
          source: "IN_SITE_GENERATED",
          createdAt: new Date().toISOString(),
        });

        return {
          ...rec,
          attended: true,
          certificateCode: assignedCode,
          checkedInAt: rec.checkedInAt || new Date().toISOString(),
        };
      });

      if (newCertificates.length > 0) {
        const bulkRes = await db.addCertificatesBulk(newCertificates);
        if (!bulkRes.cloudSaved) {
          db.saveAttendance(selectedEventId, updatedList);
          setAttendanceList(updatedList);
          setSelectedIds(new Set());

          alert(
            `⚠️ Local Codes Ready — Database Save Incomplete\n\n` +
            `Verification codes were generated in your session, but they could NOT be saved to the live cloud database.\n\n` +
            `Database Error: ${bulkRes.error || "Permission Denied (42501)"}\n\n` +
            `Action Required:\n` +
            `Please run the Supabase permission SQL in your Supabase SQL Editor, then click 'Sync to Cloud Database' in the Verified Credentials Registry so other browsers (like Edge or mobile) can verify them.`
          );
          return;
        }
      }

      db.saveAttendance(selectedEventId, updatedList);
      setAttendanceList(updatedList);
      setSelectedIds(new Set());

      alert(
        `⚡ In-App QR Generation Complete!\n\n` +
        `• Attendees Processed: ${recordsToProcess.length}\n` +
        `• Permanent Codes Preserved: ${preservedCount}\n` +
        `• New Verification Codes Issued: ${newlyIssuedCount}\n\n` +
        `All codes are now live and verifiable in the cloud database across Chrome, Edge, and all devices!`
      );
    } catch (err: any) {
      alert("Failed to generate codes: " + err.message);
    } finally {
      setIsGeneratingInApp(false);
      setInAppProgress("");
    }
  };

  // Multi-Selection Handlers
  const handleToggleSelectAll = (filteredItems: AttendanceRecord[]) => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((r) => r.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkMarkAttended = (attended: boolean) => {
    if (selectedIds.size === 0) return;
    const updated = attendanceList.map((rec) => {
      if (selectedIds.has(rec.id)) {
        return {
          ...rec,
          attended,
          checkedInAt: attended ? rec.checkedInAt || new Date().toISOString() : undefined,
        };
      }
      return rec;
    });
    db.saveAttendance(selectedEventId, updated);
    setAttendanceList(updated);
  };

  const handleBulkDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedIds.size} selected attendee(s)?`)) return;
    const updated = attendanceList.filter((r) => !selectedIds.has(r.id));
    db.saveAttendance(selectedEventId, updated);
    setAttendanceList(updated);
    setSelectedIds(new Set());
  };

  // Add Single Attendee Manually
  const handleAddSingleAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeName.trim() || !selectedEventId) return;

    const currentEvent = events.find((ev) => ev.id === selectedEventId);
    const name = newAttendeeName.trim();
    const rollNumber = newAttendeeRoll.trim().toUpperCase();
    const email = newAttendeeEmail.trim();

    let assignedCode: string | undefined = undefined;
    if (newAttendeeAttended) {
      assignedCode = generateCertificateCode("26");

      const certRecord: CertificateRecord = {
        id: `cert-${Date.now()}`,
        code: assignedCode,
        recipientName: name,
        recipientRollNumber: rollNumber || undefined,
        recipientEmail: email || undefined,
        publicNameFormat: "FULL_NAME",
        eventId: selectedEventId,
        eventTitle: currentEvent?.title || "UCET IUB Technical Event",
        certificateType: currentEvent?.certificateType || "Certificate of Participation",
        recognitionLevel: "CHAPTER_RECOGNITION",
        issuerStatement: "In recognition of active participation and successful completion.",
        activityDate: currentEvent?.startDate ? currentEvent.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        issueDate: new Date().toISOString().slice(0, 10),
        approverName: "Muhammad Roshan Ashraf",
        approverRole: "Chapter Chair",
        status: "ACTIVE",
        source: "IN_SITE_GENERATED",
        createdAt: new Date().toISOString(),
      };

      await db.addCertificate(certRecord);
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      eventId: selectedEventId,
      name,
      rollNumber,
      email,
      attended: newAttendeeAttended,
      certificateCode: assignedCode,
      checkedInAt: newAttendeeAttended ? new Date().toISOString() : undefined,
    };

    const updated = [newRecord, ...attendanceList];
    db.saveAttendance(selectedEventId, updated);
    setAttendanceList(updated);

    setIsAddModalOpen(false);
    setNewAttendeeName("");
    setNewAttendeeRoll("");
    setNewAttendeeEmail("");
    setNewAttendeeAttended(true);
  };

  // Edit Single Attendee
  const handleOpenEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditName(rec.name);
    setEditRoll(rec.rollNumber || "");
    setEditEmail(rec.email || "");
  };

  const handleSaveEditAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const trimmedName = editName.trim() || editingRecord.name;
    const trimmedRoll = editRoll.trim().toUpperCase();
    const trimmedEmail = editEmail.trim();

    setIsSavingEdit(true);

    try {
      // 1. Update local attendance state & persistence
      const updated = attendanceList.map((r) => {
        if (r.id === editingRecord.id) {
          return {
            ...r,
            name: trimmedName,
            rollNumber: trimmedRoll,
            email: trimmedEmail,
          };
        }
        return r;
      });

      db.saveAttendance(selectedEventId, updated);
      setAttendanceList(updated);

      // 2. If this attendee already has an issued verification code, update the registry & Supabase
      if (editingRecord.certificateCode) {
        const cleanCode = editingRecord.certificateCode.trim().toUpperCase();
        const existingCert = await db.fetchCertificateByCode(cleanCode);
        if (existingCert) {
          await db.addCertificate({
            ...existingCert,
            recipientName: trimmedName,
            recipientRollNumber: trimmedRoll || undefined,
            recipientEmail: trimmedEmail || undefined,
          });
        }
      }

      setEditingRecord(null);
    } catch (err) {
      console.error("Error saving attendee changes:", err);
      alert("Failed to save attendee changes. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Single Attendee Record
  const handleDeleteSingleRecord = (recordId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the attendance sheet?`)) return;
    const updated = attendanceList.filter((r) => r.id !== recordId);
    db.saveAttendance(selectedEventId, updated);
    setAttendanceList(updated);
    if (selectedIds.has(recordId)) {
      const next = new Set(selectedIds);
      next.delete(recordId);
      setSelectedIds(next);
    }
  };

  // QR Preview Modal
  const handleOpenQrPreview = async (rec: AttendanceRecord) => {
    if (!rec.certificateCode) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";
    const verifyUrl = `${origin}/verify/${rec.certificateCode}`;
    const qrDataUrl = await generateQrPngDataUrl(verifyUrl);
    setPreviewQrRecord({
      name: rec.name,
      roll: rec.rollNumber || "",
      code: rec.certificateCode,
      qrDataUrl,
    });
  };

  // Copy Verification Link
  const handleCopyLink = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";
    const url = `${origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Export Attendance to Excel (.xlsx)
  const handleExportExcel = () => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent || attendanceList.length === 0) {
      alert("No attendance records to export.");
      return;
    }

    const exportData = attendanceList.map((rec) => ({
      "Full Name": rec.name,
      "Roll Number": rec.rollNumber || "N/A",
      "Email": rec.email || "N/A",
      "Attended": rec.attended ? "Yes (Present)" : "No (Absent)",
      "Certificate Code": rec.certificateCode || "Not Issued",
      "Timestamp": rec.checkedInAt ? new Date(rec.checkedInAt).toLocaleString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const safeTitle = currentEvent.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    XLSX.writeFile(workbook, `Attendance_${safeTitle}.xlsx`);
  };

  // Export Attendance to CSV
  const handleExportCsv = () => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent || attendanceList.length === 0) {
      alert("No attendance records to export.");
      return;
    }

    const exportData = attendanceList.map((rec) => ({
      "Full Name": rec.name,
      "Roll Number": rec.rollNumber || "N/A",
      "Email": rec.email || "N/A",
      "Attended": rec.attended ? "Yes" : "No",
      "Certificate Code": rec.certificateCode || "N/A",
      "Timestamp": rec.checkedInAt || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance_${currentEvent.slug.replace(/\//g, "_")}.csv`;
    a.click();
  };

  // Bulk Generate All Attended Verification QRs & Codes as ZIP
  const handleBulkGenerateZip = async () => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent) return;

    const attendedRecords = attendanceList.filter((r) => r.attended);
    if (attendedRecords.length === 0) {
      alert("No participants are marked as 'Attended'. Please mark attendees before generating the QR pack.");
      return;
    }

    setIsGeneratingPdfs(true);
    setGenerationProgress(`Generating QR codes for ${attendedRecords.length} attendees...`);

    try {
      const zip = new JSZip();
      const qrFolder = zip.folder("Participant_QR_Codes");
      const today = new Date().toISOString().split("T")[0];
      const bulkCerts: CertificateRecord[] = [];
      const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";

      let csvContent = "Full Name,Roll Number,Email,Certificate Code,Verification URL,Status\n";

      for (let i = 0; i < attendedRecords.length; i++) {
        const rec = attendedRecords[i];
        setGenerationProgress(`Creating QR code (${i + 1}/${attendedRecords.length}): ${rec.name}`);

        const code = rec.certificateCode || generateCertificateCode("26");
        rec.certificateCode = code;

        const certRecord: CertificateRecord = {
          id: `cert-${Date.now()}-${i}`,
          code,
          recipientName: rec.name,
          recipientRollNumber: rec.rollNumber || undefined,
          recipientEmail: rec.email || undefined,
          publicNameFormat: "FULL_NAME",
          eventId: currentEvent.id,
          eventTitle: currentEvent.title,
          certificateType: currentEvent.certificateType || "Certificate of Participation",
          recognitionLevel: "CHAPTER_RECOGNITION",
          issuerStatement: "This is an official chapter recognition issued by IEEE CS UCET-IUB Student Branch Chapter.",
          activityDate: currentEvent.startDate.split("T")[0],
          issueDate: today,
          approverName: "Muhammad Roshan Ashraf",
          approverRole: "Chapter Administrator",
          status: "ACTIVE",
          source: "IN_SITE_GENERATED",
          createdAt: new Date().toISOString(),
        };

        bulkCerts.push(certRecord);

        // Generate QR code PNG
        const verifyUrl = `${origin}/verify/${code}`;
        const qrDataUrl = await generateQrPngDataUrl(verifyUrl);
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
        const cleanName = rec.name.replace(/[^a-zA-Z0-9]/g, "_");
        const cleanRoll = rec.rollNumber ? "_" + rec.rollNumber.replace(/[^a-zA-Z0-9]/g, "_") : "";
        const filename = `${code}_${cleanName}${cleanRoll}.png`;
        qrFolder?.file(filename, base64Data, { base64: true });

        csvContent += `"${rec.name}","${rec.rollNumber || ''}","${rec.email || ''}","${code}","${verifyUrl}","ACTIVE"\n`;
      }

      zip.file("Attendee_Verification_Codes.csv", csvContent);

      if (bulkCerts.length > 0) {
        await db.addCertificatesBulk(bulkCerts);
      }

      setGenerationProgress("Compressing ZIP archive...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `IEEE_CS_QR_Codes_${currentEvent.slug.replace(/\//g, "_")}.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      // Update stored codes in attendance
      db.saveAttendance(selectedEventId, attendanceList);
      setAttendanceList([...attendanceList]);

      db.addAuditLog(
        "Muhammad Roshan Ashraf",
        "BULK_QR_CODES_GENERATED",
        "events",
        selectedEventId,
        `Generated QR code pack and published ${attendedRecords.length} verification records for "${currentEvent.title}".`
      );

      alert(`Success! Generated QR code package and published all ${attendedRecords.length} records to the live verification registry.`);
    } catch (err: any) {
      console.error(err);
      alert("An error occurred during QR pack generation: " + (err?.message || ""));
    } finally {
      setIsGeneratingPdfs(false);
      setGenerationProgress("");
    }
  };

  // Filtered List
  const filteredList = attendanceList.filter((item) => {
    const matchesFilter =
      filterMode === "ALL" ||
      (filterMode === "ATTENDED" && item.attended) ||
      (filterMode === "ABSENT" && !item.attended) ||
      (filterMode === "ISSUED" && Boolean(item.certificateCode)) ||
      (filterMode === "PENDING" && !item.certificateCode && item.attended);

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.rollNumber && item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.certificateCode && item.certificateCode.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const attendedCount = attendanceList.filter((r) => r.attended).length;
  const issuedCount = attendanceList.filter((r) => Boolean(r.certificateCode)).length;
  const pendingCount = attendanceList.filter((r) => r.attended && !r.certificateCode).length;
  const currentEvent = events.find((e) => e.id === selectedEventId);

  return (
    <AdminLayout>
      <div className="space-y-8 font-openSans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider">
              <Users size={16} /> Attendance & Verification Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
              Attendance & QR Verification Code Hub
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Upload attendance sheets (Excel/CSV with Roll Numbers & Emails), verify attendees, and issue tamper-evident permanent QR codes.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            {/* 1. Upload Sheet */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 border border-ieee-blue bg-ieee-surfaceTint/50 text-ieee-navy text-xs font-semibold rounded-lg hover:bg-ieee-surfaceTint flex items-center gap-1.5 shadow-xs"
              title="Upload participant spreadsheet (.xlsx or .csv)"
            >
              <Upload size={14} className="text-ieee-blue" /> Upload Sheet
            </button>

            {/* 2. Sample Template */}
            <button
              onClick={handleDownloadSampleTemplate}
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
              title="Download pre-formatted sample Excel sheet with correct headers"
            >
              <FileDown size={14} className="text-gray-500" /> Sample Template
            </button>

            {/* 3. Add Attendee */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
              title="Add a single walk-in attendee manually"
            >
              <Plus size={14} className="text-ieee-navy" /> Add Attendee
            </button>

            {/* 4. Generate QR Codes (In-App) */}
            <Button
              onClick={() => handleGenerateInApp()}
              variant="primary"
              disabled={isGeneratingInApp || attendedCount === 0}
              className="flex items-center gap-1.5 shadow-xs text-xs"
            >
              <Sparkles size={14} />
              {isGeneratingInApp ? "Generating in DB..." : "Generate QR Codes"}
            </Button>

            {/* 5. Download QR Pack (.zip) */}
            <Button
              onClick={handleBulkGenerateZip}
              variant="accent"
              disabled={isGeneratingPdfs || attendedCount === 0}
              className="flex items-center gap-1.5 shadow-xs text-xs"
            >
              <Download size={14} />
              {isGeneratingPdfs ? "Zipping QR Pack..." : `Download QR Pack (.zip)`}
            </Button>

            {/* 6. Export Links (Excel) */}
            <button
              onClick={handleExportLinksExcel}
              className="px-3 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 shadow-xs transition-colors"
              title="Export roster containing recipient names, roll numbers, emails, and direct verification URLs"
            >
              <FileSpreadsheet size={14} className="text-emerald-700" /> Export Links (Excel)
            </button>

            {/* 7. Wipe Event Data */}
            <button
              onClick={handleClearEventData}
              className="px-3 py-2 border border-red-200 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 flex items-center gap-1.5 shadow-xs transition-colors"
              title="Wipe attendance sheet or QR verification codes for this event"
            >
              <Trash2 size={14} className="text-red-600" /> Wipe Event Data
            </button>
          </div>
        </div>

        {/* Granular Wipe Confirmation Modal */}
        {isWipeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
              <div className="flex items-center gap-2.5 text-red-600">
                <Trash2 size={20} />
                <h3 className="font-montserrat font-bold text-lg text-gray-900">
                  Wipe Data: {currentEvent?.title || "Event"}
                </h3>
              </div>

              <p className="text-xs text-gray-600">
                Choose what you want to remove. Once wiped, you can upload fresh corrected data:
              </p>

              <div className="space-y-2 border border-red-100 p-3 rounded-lg bg-red-50/40">
                <label className="flex items-start gap-2.5 text-xs text-gray-800 cursor-pointer p-1.5 rounded hover:bg-white">
                  <input
                    type="radio"
                    name="modalWipeScope"
                    value="ALL"
                    checked={wipeScope === "ALL"}
                    onChange={() => setWipeScope("ALL")}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <strong className="block text-gray-900">Everything (Full Reset)</strong>
                    <span className="text-[11px] text-gray-500">Wipe Attendance records AND revoke all issued QR & verification codes.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-gray-800 cursor-pointer p-1.5 rounded hover:bg-white">
                  <input
                    type="radio"
                    name="modalWipeScope"
                    value="ATTENDANCE_ONLY"
                    checked={wipeScope === "ATTENDANCE_ONLY"}
                    onChange={() => setWipeScope("ATTENDANCE_ONLY")}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <strong className="block text-gray-900">Attendance Sheet Only</strong>
                    <span className="text-[11px] text-gray-500">Clears uploaded attendees. Previously issued QR and verification codes remain permanent.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-gray-800 cursor-pointer p-1.5 rounded hover:bg-white">
                  <input
                    type="radio"
                    name="modalWipeScope"
                    value="CODES_ONLY"
                    checked={wipeScope === "CODES_ONLY"}
                    onChange={() => setWipeScope("CODES_ONLY")}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <strong className="block text-gray-900">QR & Verification Codes Only</strong>
                    <span className="text-[11px] text-gray-500">Revokes codes from the database so fresh QR codes can be generated for the same attendees.</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsWipeModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeGranularWipe}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Confirm & Wipe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Attendee Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                  <Plus size={18} className="text-ieee-blue" /> Add Single Attendee
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSingleAttendee} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roshan Ashraf"
                    value={newAttendeeName}
                    onChange={(e) => setNewAttendeeName(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Roll Number / Student ID</label>
                  <input
                    type="text"
                    placeholder="e.g. S23BINCE1M40414"
                    value={newAttendeeRoll}
                    onChange={(e) => setNewAttendeeRoll(e.target.value.toUpperCase())}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Email / Gmail Address</label>
                  <input
                    type="email"
                    placeholder="e.g. ieeecsiub.contact@gmail.com"
                    value={newAttendeeEmail}
                    onChange={(e) => setNewAttendeeEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAttendeeAttended}
                      onChange={(e) => setNewAttendeeAttended(e.target.checked)}
                      className="rounded text-ieee-navy focus:ring-ieee-blue"
                    />
                    <span className="font-semibold text-gray-700">Mark as Present / Attended immediately</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-ieee-navy hover:bg-ieee-blue text-white font-bold rounded-lg shadow-sm"
                  >
                    Add Attendee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Attendee Modal */}
        {editingRecord && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                    <Edit2 size={16} className="text-ieee-blue" /> Edit Attendee Information
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Correct misspelled names, update roll numbers, or fix emails.
                  </p>
                </div>
                <button onClick={() => !isSavingEdit && setEditingRecord(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditAttendee} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Muhammad Roshan Ashraf"
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-medium"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">This exact name appears on public verification and records.</p>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Roll / Registration Number</label>
                  <input
                    type="text"
                    value={editRoll}
                    onChange={(e) => setEditRoll(e.target.value.toUpperCase())}
                    placeholder="e.g. S23BINCE1M40414"
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Email / Gmail Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. ieeecsiub.contact@gmail.com"
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                {editingRecord.certificateCode ? (
                  <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-900 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Active Verification Code:</span>
                      <strong className="font-mono text-ieee-blue">{editingRecord.certificateCode}</strong>
                    </div>
                    <p className="text-[10px] text-blue-700">
                      ✓ Saving will instantly update the official public verification page and QR code.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-gray-50 border rounded text-[11px] text-gray-500">
                    No code issued yet. Changes will be ready whenever codes are generated.
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-2 bg-ieee-navy hover:bg-ieee-blue text-white font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingEdit ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Save & Sync</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Code Preview Modal */}
        {previewQrRecord && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-center space-y-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="font-montserrat font-bold text-base text-ieee-navy">{previewQrRecord.name}</h3>
                  <span className="text-xs text-gray-500 font-mono">{previewQrRecord.roll || "UCET IUB"}</span>
                </div>
                <button onClick={() => setPreviewQrRecord(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border flex justify-center">
                <img
                  src={previewQrRecord.qrDataUrl}
                  alt={`QR Code for ${previewQrRecord.code}`}
                  className="w-48 h-48 object-contain rounded-lg shadow-xs"
                />
              </div>

              <div>
                <span className="text-[11px] text-gray-400 uppercase font-semibold block">Official Verification Code</span>
                <span className="font-mono font-bold text-sm text-ieee-navy bg-ieee-surfaceTint px-3 py-1 rounded inline-block mt-0.5">
                  {previewQrRecord.code}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <a
                  href={previewQrRecord.qrDataUrl}
                  download={`QR_${previewQrRecord.code}_${previewQrRecord.name.replace(/\s+/g, "_")}.png`}
                  className="px-4 py-2 bg-ieee-navy hover:bg-ieee-blue text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Download PNG
                </a>
                <button
                  onClick={() => handleCopyLink(previewQrRecord.code)}
                  className="px-3.5 py-2 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                >
                  {copiedCode === previewQrRecord.code ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copiedCode === previewQrRecord.code ? "Copied!" : "Copy URL"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generation Progress Bar */}
        {(isGeneratingPdfs || isGeneratingInApp) && (
          <div className="p-4 bg-ieee-surfaceTint border border-ieee-blue rounded-card space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-ieee-navy">
              <span>{generationProgress || inAppProgress}</span>
              <RefreshCw size={14} className="animate-spin text-ieee-blue" />
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-ieee-orange h-full animate-pulse w-full"></div>
            </div>
          </div>
        )}

        {/* Event Selector & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm space-y-4 md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-montserrat font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Select Chapter Event:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs font-montserrat font-bold text-ieee-navy bg-white focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-montserrat font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Verification Credential Type:
                </label>
                <div className="w-full p-2.5 border rounded-lg text-xs font-montserrat font-bold text-ieee-navy bg-gray-50 flex items-center justify-between">
                  <span>{currentEvent?.certificateType || "Certificate of Participation"}</span>
                  <span className="text-[10px] text-ieee-blue uppercase bg-ieee-surfaceTint px-2 py-0.5 rounded font-bold">QR Auto</span>
                </div>
              </div>
            </div>

            {currentEvent && (
              <div className="text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-gray-100">
                <div className="flex flex-wrap gap-4">
                  <span>Date: <strong>{new Date(currentEvent.startDate).toLocaleDateString()}</strong></span>
                  <span>Venue: <strong>{currentEvent.venue}</strong></span>
                  <span>Cert Type: <strong>{currentEvent.certificateType}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const currentlyOpen = currentEvent.isRegistrationOpen ?? (currentEvent.status === "UPCOMING");
                    const nextState = !currentlyOpen;
                    const updated = events.map((ev) => ev.id === currentEvent.id ? { ...ev, isRegistrationOpen: nextState } : ev);
                    setEvents(updated);
                    await db.updateEvent(currentEvent.id, { isRegistrationOpen: nextState });
                    try {
                      await saveEventAction({ ...currentEvent, isRegistrationOpen: nextState });
                    } catch (err) {
                      console.warn("Toggle registration save error:", err);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-montserrat font-bold transition-all shadow-xs ${
                    (currentEvent.isRegistrationOpen ?? (currentEvent.status === "UPCOMING"))
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                      : "bg-red-50 text-red-700 border border-red-300 hover:bg-red-100"
                  }`}
                  title="Click to toggle public registration open / closed for this event"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    (currentEvent.isRegistrationOpen ?? (currentEvent.status === "UPCOMING")) ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`} />
                  {(currentEvent.isRegistrationOpen ?? (currentEvent.status === "UPCOMING")) ? "Registration: OPEN" : "Registration: CLOSED"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-card p-5 shadow-sm flex items-center justify-around">
            <div className="text-center">
              <span className="text-xs uppercase font-bold text-gray-500">Total Registered</span>
              <div className="text-2xl font-montserrat font-extrabold text-ieee-navy mt-1">
                {attendanceList.length}
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <span className="text-xs uppercase font-bold text-status-active">Attended</span>
              <div className="text-2xl font-montserrat font-extrabold text-[#00843D] mt-1">
                {attendedCount}
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <span className="text-xs uppercase font-bold text-ieee-blue">Codes Issued</span>
              <div className="text-2xl font-montserrat font-extrabold text-ieee-blue mt-1">
                {issuedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: `All (${attendanceList.length})` },
              { id: "ATTENDED", label: `Attended (${attendedCount})` },
              { id: "ABSENT", label: `Absent (${attendanceList.length - attendedCount})` },
              { id: "ISSUED", label: `Codes Issued (${issuedCount})` },
              { id: "PENDING", label: `Pending (${pendingCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${
                  filterMode === tab.id
                    ? "bg-ieee-navy text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, roll, email, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
            />
          </div>
        </div>

        {/* Floating Bulk-Action Bar for Selected Rows */}
        {selectedIds.size > 0 && (
          <div className="bg-ieee-navy text-white px-5 py-3 rounded-card flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <span className="bg-ieee-orange text-black font-bold px-2 py-0.5 rounded-full text-xs">
                {selectedIds.size}
              </span>
              <span>Attendee(s) Selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkMarkAttended(true)}
                className="px-3 py-1.5 bg-[#00843D] hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              >
                <CheckCircle size={13} /> Mark Present
              </button>
              <button
                onClick={() => handleBulkMarkAttended(false)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              >
                <XCircle size={13} /> Mark Absent
              </button>
              <button
                onClick={() => handleGenerateInApp(Array.from(selectedIds))}
                disabled={isGeneratingInApp}
                className="px-3 py-1.5 bg-ieee-blue hover:bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Sparkles size={13} /> Generate Codes for Selected
              </button>
              <button
                onClick={handleBulkDeleteSelected}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Trash2 size={13} /> Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1 text-gray-300 hover:text-white text-xs underline"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs">
              No attendance records found. Click "Upload Sheet" or "Add Attendee" to begin!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 font-montserrat font-bold text-gray-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredList.length && filteredList.length > 0}
                        onChange={() => handleToggleSelectAll(filteredList)}
                        className="rounded text-ieee-navy focus:ring-ieee-blue cursor-pointer"
                        title="Select / Deselect All Visible"
                      />
                    </th>
                    <th className="p-4 w-12 text-center">Status</th>
                    <th className="p-4">Participant Name</th>
                    <th className="p-4">Roll No & Email</th>
                    <th className="p-4">Verification Code & QR</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredList.map((rec) => {
                    const isSelected = selectedIds.has(rec.id);
                    return (
                      <tr
                        key={rec.id}
                        className={`transition-colors ${
                          isSelected ? "bg-blue-50/60" : "hover:bg-gray-50/80"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(rec.id)}
                            className="rounded text-ieee-navy focus:ring-ieee-blue cursor-pointer"
                          />
                        </td>

                        {/* Status Toggle */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleAttendance(rec.id)}
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center transition-all ${
                              rec.attended
                                ? "bg-[#00843D] text-white shadow-sm"
                                : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                            }`}
                            title={rec.attended ? "Click to mark Absent" : "Click to mark Attended"}
                          >
                            {rec.attended ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          </button>
                        </td>

                        {/* Name */}
                        <td className="p-4 font-montserrat font-bold text-gray-800 text-sm">
                          <div className="flex items-center gap-1.5 group">
                            <span>{rec.name}</span>
                            <button
                              onClick={() => handleOpenEditModal(rec)}
                              className="text-gray-400 hover:text-ieee-blue p-1 rounded hover:bg-gray-100 opacity-70 hover:opacity-100 transition-opacity"
                              title="Edit student name or details"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Roll & Email */}
                        <td className="p-4 text-gray-600 space-y-0.5">
                          <div className="font-semibold text-ieee-navy font-mono uppercase">{rec.rollNumber || "No Roll No"}</div>
                          <div className="text-[11px] text-gray-500">{rec.email || "No Email"}</div>
                        </td>

                        {/* Verification Code & Quick Tools */}
                        <td className="p-4">
                          {rec.certificateCode ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-ieee-blue bg-ieee-surfaceTint px-2 py-0.5 rounded text-[11px]">
                                {rec.certificateCode}
                              </span>

                              {/* View QR Button */}
                              <button
                                onClick={() => handleOpenQrPreview(rec)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-ieee-navy"
                                title="View & Download QR Code Card"
                              >
                                <QrCode size={14} />
                              </button>

                              {/* Copy Link Button */}
                              <button
                                onClick={() => handleCopyLink(rec.certificateCode!)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-ieee-navy"
                                title="Copy Official Verification URL"
                              >
                                {copiedCode === rec.certificateCode ? (
                                  <Check size={14} className="text-green-600" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">
                              {rec.attended ? "Ready for Issuance (Click Generate)" : "Mark attended to issue"}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {rec.certificateCode && (
                            <a
                              href={`/verify/${rec.certificateCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 bg-ieee-surfaceTint text-ieee-navy hover:bg-ieee-blue hover:text-white transition-colors"
                              title="Open live verification page"
                            >
                              <span>Verify</span>
                              <ExternalLink size={11} />
                            </a>
                          )}

                          {/* Quick Edit */}
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-ieee-surfaceTint hover:text-ieee-navy rounded inline-flex items-center gap-1 transition-colors"
                            title="Edit student name, roll number, or email"
                          >
                            <Edit2 size={11} />
                            <span>Edit</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSingleRecord(rec.id, rec.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remove attendee from list"
                          >
                            <Trash2 size={13} />
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
      </div>
    </AdminLayout>
  );
}

