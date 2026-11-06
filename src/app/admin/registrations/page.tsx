"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { getRegistrationsAction } from "@/app/actions/operations";
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
  Upload,
  FileSpreadsheet,
  Sparkles,
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

  // 2. Case-insensitive & punctuation-stripped normalized key match
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

  // 3. Substring & question header match (handles Google Forms like "Roll Number (e.g. FA21-BCS-001)")
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

  // 4. Value-pattern fallback if headers are non-standard
  if (type === "phone") {
    for (const k of keys) {
      const val = row[k];
      if (!val) continue;
      const digits = String(val).replace(/[^\d]/g, "");
      if (digits.length >= 10 && (digits.startsWith("03") || digits.startsWith("3") || digits.startsWith("923"))) {
        return formatExtractedValue(val, "phone");
      }
    }
  }

  if (type === "roll") {
    for (const k of keys) {
      const normK = cleanStr(k);
      if (normK.includes("name") || normK.includes("email") || normK.includes("phone") || normK.includes("time") || normK.includes("date") || normK.includes("dept") || normK.includes("program")) continue;
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

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [professionFilter, setProfessionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editProfession, setEditProfession] = useState<"STUDENT" | "INDUSTRIAL" | "OTHER">("STUDENT");
  const [editIdentityType, setEditIdentityType] = useState<"ROLL_NUMBER" | "CNIC" | "PASSPORT">("ROLL_NUMBER");
  const [editIdentityNumber, setEditIdentityNumber] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editDept, setEditDept] = useState("Computer Science & IT / UCET");
  const [editDegreeProgram, setEditDegreeProgram] = useState("");
  const [editOrganization, setEditOrganization] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editStatus, setEditStatus] = useState<Registration["status"]>("CONFIRMED");
  const [editIsIeee, setEditIsIeee] = useState(false);
  const [editIeeeNo, setEditIeeeNo] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [selectedProjectSummary, setSelectedProjectSummary] = useState<{ title: string; text: string } | null>(null);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEventId, setAddEventId] = useState("");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addProfession, setAddProfession] = useState<"STUDENT" | "INDUSTRIAL" | "OTHER">("STUDENT");
  const [addIdentityType, setAddIdentityType] = useState<"ROLL_NUMBER" | "CNIC" | "PASSPORT">("ROLL_NUMBER");
  const [addIdentityNumber, setAddIdentityNumber] = useState("");
  const [addRoll, setAddRoll] = useState("");
  const [addDept, setAddDept] = useState("Computer Science & IT / UCET");
  const [addDegreeProgram, setAddDegreeProgram] = useState("");
  const [addOrganization, setAddOrganization] = useState("");
  const [addDesignation, setAddDesignation] = useState("");
  const [addUniversity, setAddUniversity] = useState("The Islamia University of Bahawalpur");
  const [addSemester, setAddSemester] = useState("6th Semester");
  const [addStatus, setAddStatus] = useState<Registration["status"]>("CONFIRMED");
  const [addIsIeee, setAddIsIeee] = useState(false);
  const [addIeeeNo, setAddIeeeNo] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Action Feedback States
  const [copiedTicket, setCopiedTicket] = useState<string | null>(null);
  const [pushingAttendanceId, setPushingAttendanceId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [dbPermissionDenied, setDbPermissionDenied] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [liveRegs, liveEvents, serverRes] = await Promise.all([
      db.fetchRegistrations(),
      db.fetchEvents(),
      getRegistrationsAction().catch(() => null),
    ]);

    if (serverRes && !serverRes.success && serverRes.permissionDenied) {
      setDbPermissionDenied(true);
    } else if (serverRes && serverRes.success) {
      setDbPermissionDenied(false);
    }

    // Merge server registrations if available
    let combined = [...liveRegs];
    if (serverRes && serverRes.success && Array.isArray(serverRes.data)) {
      const existingKeys = new Set(combined.map((r) => (r.ticketCode ? r.ticketCode.toUpperCase() : r.id)));
      serverRes.data.forEach((sr: any) => {
        const key = (sr.ticketCode ? sr.ticketCode.toUpperCase() : sr.id);
        if (!existingKeys.has(key)) {
          combined.push(sr);
          existingKeys.add(key);
        }
      });
    }

    setRegistrations(combined);
    setEvents(liveEvents);
    if (liveEvents.length > 0 && !addEventId) {
      setAddEventId(liveEvents[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Cross-tab live sync via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("ieee_cs_channel");
        bc.onmessage = (event) => {
          if (event.data?.type === "REGISTRATION_ADDED") {
            loadData();
          }
        };
      } catch {}
    }

    // LocalStorage storage event fallback for cross-tab updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ieee_cs_registrations" || e.key === "registrations") {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const eventMap = new Map<string, EventItem>();
  events.forEach((ev) => eventMap.set(ev.id, ev));

  // Copy Ticket Code
  const handleCopyTicket = (ticket: string) => {
    navigator.clipboard.writeText(ticket);
    setCopiedTicket(ticket);
    setTimeout(() => setCopiedTicket(null), 2000);
  };

  // Clear All Test Registrations from Database & Local Cache
  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all test registrations from the database and local cache? This will reset the table so you can receive clean real-time registrations.")) {
      setIsLoading(true);
      await db.clearAllRegistrations();
      setRegistrations([]);
      setIsLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (reg: Registration) => {
    setEditingReg(reg);
    setEditName(reg.fullName || "");
    setEditEmail(reg.email || "");
    setEditPhone(reg.phone || "");
    setEditRoll(reg.rollNumber || "");
    setEditDept(reg.department || "Computer Science & IT / UCET");
    setEditDegreeProgram(reg.degreeProgram || "");
    setEditStatus(reg.status || "CONFIRMED");
    setEditIsIeee(Boolean(reg.isIeeeMember));
    setEditIeeeNo(reg.ieeeMembershipNumber || "");

    const prof: "STUDENT" | "INDUSTRIAL" | "OTHER" =
      reg.profession ||
      (reg.designation || reg.organization ? "INDUSTRIAL" : "STUDENT");
    setEditProfession(prof);

    const docType: "ROLL_NUMBER" | "CNIC" | "PASSPORT" =
      reg.identityType ||
      (reg.passport ? "PASSPORT" : (reg.cnic ? "CNIC" : "ROLL_NUMBER"));
    setEditIdentityType(docType);

    const activeId =
      reg.identityNumber ||
      reg.passport ||
      reg.cnic ||
      (reg.rollNumber && reg.rollNumber !== "N/A" ? reg.rollNumber : "");
    setEditIdentityNumber(activeId);
    setEditOrganization(reg.organization || "");
    setEditDesignation(reg.designation || "");
    setEditUniversity(reg.university || "The Islamia University of Bahawalpur");
    setEditSemester(reg.semester || "6th Semester");
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg || !editName.trim()) return;

    setIsSavingEdit(true);
    try {
      let finalRoll = editIdentityNumber.trim().toUpperCase();
      let finalCnic: string | undefined = undefined;
      let finalPassport: string | undefined = undefined;

      if (editIdentityType === "PASSPORT") {
        finalPassport = editIdentityNumber.trim().toUpperCase();
      } else if (editIdentityType === "CNIC") {
        finalCnic = editIdentityNumber.trim();
      }

      let effectiveDept = editDept.trim();
      let effectiveProg = editDegreeProgram.trim();

      if (editProfession === "INDUSTRIAL") {
        effectiveDept = editOrganization.trim() || "Corporate / Industry";
        effectiveProg = editDesignation.trim() || "Industry Professional";
      } else if (editProfession === "OTHER") {
        effectiveDept = editOrganization.trim() || "Other Organization";
        effectiveProg = editDesignation.trim() || "Guest / Participant";
      } else {
        if (!effectiveDept) effectiveDept = "Computer Science & IT / UCET";
      }

      await db.updateRegistration(editingReg.id, {
        fullName: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim() || undefined,
        profession: editProfession,
        identityType: editIdentityType,
        identityNumber: editIdentityNumber.trim().toUpperCase(),
        rollNumber: finalRoll || (editProfession === "STUDENT" ? "N/A" : "N/A"),
        cnic: finalCnic,
        passport: finalPassport,
        organization: editOrganization.trim() || undefined,
        designation: editDesignation.trim() || undefined,
        university: editUniversity.trim() || undefined,
        semester: editProfession === "STUDENT" ? editSemester : undefined,
        department: effectiveDept,
        degreeProgram: effectiveProg || undefined,
        status: editStatus,
        isIeeeMember: editIsIeee,
        ieeeMembershipNumber: editIeeeNo.trim() || undefined,
      });

      await loadData();
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
      const ticketCode = "TCK-" + crypto.randomBytes(4).toString("hex").toUpperCase();
      const privateToken = crypto.randomBytes(16).toString("hex");
      const regId = crypto.randomUUID();

      let finalRoll = addIdentityNumber.trim().toUpperCase();
      let finalCnic: string | undefined = undefined;
      let finalPassport: string | undefined = undefined;

      if (addIdentityType === "PASSPORT") {
        finalPassport = addIdentityNumber.trim().toUpperCase();
      } else if (addIdentityType === "CNIC") {
        finalCnic = addIdentityNumber.trim();
      }

      let effectiveDept = addDept.trim();
      let effectiveProg = addDegreeProgram.trim();

      if (addProfession === "INDUSTRIAL") {
        effectiveDept = addOrganization.trim() || "Corporate / Industry";
        effectiveProg = addDesignation.trim() || "Industry Professional";
      } else if (addProfession === "OTHER") {
        effectiveDept = addOrganization.trim() || "Other Organization";
        effectiveProg = addDesignation.trim() || "Guest / Participant";
      } else {
        if (!effectiveDept) effectiveDept = "Computer Science & IT / UCET";
      }

      const newReg: Registration = {
        id: regId,
        eventId: addEventId,
        privateToken,
        fullName: addName.trim(),
        namePreference: "FULL_NAME",
        email: addEmail.trim().toLowerCase(),
        phone: addPhone.trim() || "0300-0000000",
        profession: addProfession,
        identityType: addIdentityType,
        identityNumber: addIdentityNumber.trim().toUpperCase() || "N/A",
        rollNumber: finalRoll || (addProfession === "STUDENT" ? "N/A" : "N/A"),
        cnic: finalCnic,
        passport: finalPassport,
        organization: addOrganization.trim() || undefined,
        designation: addDesignation.trim() || undefined,
        university: addUniversity.trim() || undefined,
        semester: addProfession === "STUDENT" ? addSemester : undefined,
        department: effectiveDept,
        degreeProgram: effectiveProg || undefined,
        isIeeeMember: addIsIeee,
        ieeeMembershipNumber: addIeeeNo.trim() || undefined,
        photoConsent: true,
        status: addStatus,
        ticketCode,
        createdAt: new Date().toISOString(),
      };

      await db.addRegistration(newReg);
      await loadData();
      setIsAddModalOpen(false);

      // Reset fields
      setAddName("");
      setAddEmail("");
      setAddPhone("");
      setAddIdentityNumber("");
      setAddOrganization("");
      setAddDesignation("");
      setAddDegreeProgram("");
      setAddIeeeNo("");
      setAddIsIeee(false);
      alert(`Registration created successfully!\nAttendee: ${newReg.fullName}\nTicket Code: ${ticketCode}`);
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
        teamName: reg.teamName,
        projectTitle: reg.projectTitle,
        teamMembers: reg.teamMembers,
        projectDomain: reg.projectDomain,
      };

      const updated = [...currentAttendance, newAttendee];
      db.saveAttendance(reg.eventId, updated);

      const displayName = reg.teamName ? `Team ${reg.teamName} (${reg.fullName})` : reg.fullName;
      alert(`Added "${displayName}" to the Event Attendance Sheet! You can now generate their QR code from the Attendance Hub.`);
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
        "Program / Degree": r.degreeProgram || "N/A",
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

  // Export to CSV (.csv)
  const handleExportCSV = () => {
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
        "Program / Degree": r.degreeProgram || "N/A",
        "Department": r.department || "Computer Science",
        "IEEE Member": r.isIeeeMember ? "Yes" : "No",
        "IEEE Membership #": r.ieeeMembershipNumber || "N/A",
        "Ticket Code": r.ticketCode || "N/A",
        "Registration Status": r.status,
        "Registered At": r.createdAt ? formatPKTDateTime(r.createdAt) : "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const eventName =
      selectedEventId === "ALL"
        ? "All_Events"
        : (eventMap.get(selectedEventId)?.slug.replace(/\//g, "_") || "Event");
    link.setAttribute("href", url);
    link.setAttribute("download", `IEEE_CS_Registrations_${eventName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Deduplicate and clean registrations
  const handleDeduplicate = async () => {
    const res = db.deduplicateRegistrations();
    await loadData();
    if (res.removed > 0) {
      alert(`Successfully merged and removed ${res.removed} duplicate registration(s)! Total unique registrations is now ${res.after}.`);
    } else {
      alert(`Registrations are already 100% clean and free of duplicates (${res.after} unique records).`);
    }
  };

  // Import from Excel or CSV
  const handleImportSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so user can re-upload same file
    e.target.value = "";

    try {
      setIsImporting(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonRows.length === 0) {
        alert("The uploaded spreadsheet is empty.");
        return;
      }

      // Default target event
      let targetEventId = selectedEventId !== "ALL" ? selectedEventId : (events[0]?.id || "");
      if (!targetEventId && events.length > 0) {
        targetEventId = events[0].id;
      }

      let newCount = 0;
      let updatedCount = 0;
      const sheetSeen = new Set<string>();

      const ROLL_ALIASES = [
        "rollnumber", "rollno", "roll", "regno", "regnumber", "registration",
        "registrationno", "registrationnumber", "cmsid", "cms", "studentid",
        "seatno", "enrollment", "enrollmentno", "studentrollno", "id", "reg",
        "roll_number", "roll_no", "reg_no", "student_id"
      ];
      const PHONE_ALIASES = [
        "phonenumber", "phone", "phoneno", "mobile", "mobileno", "mobilenumber",
        "whatsapp", "whatsappno", "whatsappnumber", "contact", "contactno",
        "contactnumber", "cell", "cellno", "cellnumber", "tel", "phone_number"
      ];
      const NAME_ALIASES = [
        "fullname", "studentname", "participantname", "name", "student", "attendee",
        "attendeename", "participant", "yourname", "nameofparticipant", "candidate", "candidatename"
      ];
      const EMAIL_ALIASES = [
        "emailaddress", "email", "gmail", "studentemail", "mail", "emailgmail",
        "contactemail", "youremail", "emailid"
      ];
      const DEPT_ALIASES = [
        "department", "dept", "faculty", "discipline"
      ];
      const PROGRAM_ALIASES = [
        "programdegree", "degreeprogram", "degree", "program", "studyprogram",
        "bsms", "course", "batch", "semester", "session"
      ];
      const IEEE_ALIASES = [
        "ieeemember", "member", "isieeemember", "isieee", "ieee", "areyouanieeemember"
      ];
      const IEEE_NO_ALIASES = [
        "ieeemembership", "ieeemembershipnumber", "ieeenumber", "ieeeno",
        "membershipnumber", "memberid", "ieeeid", "ieeemembershipno"
      ];

      // Team & Project Expo Aliases
      const TEAM_NAME_ALIASES = ["teamname", "team_name", "nameofteam", "groupname", "team"];
      const PROJECT_TITLE_ALIASES = ["projecttitle", "project_title", "titleofproject", "projectname", "project"];
      const TEAM_MEMBERS_ALIASES = ["teammembernames", "teammembers", "members", "teammembernameswritethenamesofallmembersseparatedbycommas", "membernames", "teammates"];
      const TEAM_LEADER_ALIASES = ["teamleadername", "teamleader", "teamlead", "leadername", "leader", "teamleadname"];
      const LEADER_PHONE_ALIASES = ["teamleaderwhatsappnumber", "teamleaderwhatsapp", "teamleaderphone", "leaderwhatsapp", "leaderphone"];
      const LEADER_CNIC_ALIASES = ["teamleadercnicnumber", "teamleadercnic", "leadercnic", "cnic", "cnicnumber"];
      const DOMAIN_ALIASES = ["selectprojectdomaincategory", "projectdomain", "category", "domain", "projectcategory"];
      const SUMMARY_ALIASES = ["projectsummary", "summary", "abstract", "projectdescription", "description"];
      const POSTER_ALIASES = ["projectposter", "poster", "posterlink", "posterurl", "driveposter"];
      const VIDEO_ALIASES = ["googledrivedownloadablelinkfortechnicalprojectvideomaxduration120sec", "videodemo", "videourl", "videolink", "demovideo", "projectvideo"];
      const RECEIPT_ALIASES = ["receiptid", "receipt", "transactionid", "tid", "reference", "referencenumber"];
      const BANK_ALIASES = ["bankname", "bank", "paymentbank", "depositorbank"];
      const AMOUNT_ALIASES = ["depositedamount", "amount", "fee", "registrationfee"];
      const PRIZE_BANK_ALIASES = ["teamleadbankname", "prizebankname", "prizebank"];
      const PRIZE_ACCOUNT_ALIASES = ["teamleadaccountnumberprizemoneyforthewinninggroupswillbetransferredtotheteamleadaccount", "teamleadaccountnumber", "prizeaccount", "prizeaccountnumber"];

      for (let idx = 0; idx < jsonRows.length; idx++) {
        const row = jsonRows[idx];

        // 1. Check for Team / Expo Fields
        const teamName = extractFieldFromRow(row, TEAM_NAME_ALIASES, "text");
        const projectTitle = extractFieldFromRow(row, PROJECT_TITLE_ALIASES, "text");
        const rawMembers = extractFieldFromRow(row, TEAM_MEMBERS_ALIASES, "text");
        const teamLeader = extractFieldFromRow(row, TEAM_LEADER_ALIASES, "text");
        const leaderPhone = extractFieldFromRow(row, LEADER_PHONE_ALIASES, "phone");
        const leaderCnic = extractFieldFromRow(row, LEADER_CNIC_ALIASES, "text");
        const projectDomain = extractFieldFromRow(row, DOMAIN_ALIASES, "text");
        const projectSummary = extractFieldFromRow(row, SUMMARY_ALIASES, "text");
        const posterUrl = extractFieldFromRow(row, POSTER_ALIASES, "text");
        const videoDemoUrl = extractFieldFromRow(row, VIDEO_ALIASES, "text");
        const receiptId = extractFieldFromRow(row, RECEIPT_ALIASES, "text");
        const bankName = extractFieldFromRow(row, BANK_ALIASES, "text");
        const depositedAmount = Number(extractFieldFromRow(row, AMOUNT_ALIASES, "text").replace(/[^\d.]/g, "")) || 1000;
        const prizeBankName = extractFieldFromRow(row, PRIZE_BANK_ALIASES, "text");
        const prizeAccountNumber = extractFieldFromRow(row, PRIZE_ACCOUNT_ALIASES, "text");
        const semester = extractFieldFromRow(row, ["semester"], "text");
        const city = extractFieldFromRow(row, ["iamfromthecity", "city"], "text");

        const parsedMembers: string[] = rawMembers
          ? rawMembers.split(/[,\n;]+/).map((m) => m.trim().replace(/^[\d\)\.\-\s]+/, "").trim()).filter(Boolean)
          : [];

        // 2. Resolve Full Name
        let fullName = extractFieldFromRow(row, NAME_ALIASES, "text");
        if (!fullName && teamLeader) fullName = teamLeader;
        if (!fullName && teamName) fullName = `${teamName} Leader`;
        if (!fullName) continue;

        const rollNumber = extractFieldFromRow(row, ROLL_ALIASES, "roll");

        const email = extractFieldFromRow(row, EMAIL_ALIASES, "email") ||
          `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${Date.now().toString().slice(-4)}@ucet.iub.edu.pk`;

        const phone = leaderPhone || extractFieldFromRow(row, PHONE_ALIASES, "phone") || "0300-0000000";

        const department = extractFieldFromRow(row, DEPT_ALIASES, "text") || "Computer Science";

        const degreeProgram = semester ? `${semester} Semester` : extractFieldFromRow(row, PROGRAM_ALIASES, "text");

        const ieeeRaw = extractFieldFromRow(row, IEEE_ALIASES, "text").toLowerCase();
        const isIeeeMember = ieeeRaw.includes("yes") || ieeeRaw.includes("true") || ieeeRaw.includes("1");

        const ieeeNo = extractFieldFromRow(row, IEEE_NO_ALIASES, "text");

        const ticketRaw = extractFieldFromRow(row, ["ticketcode", "ticket", "code", "ticketnumber", "ticketid"], "text");

        const statusRaw = extractFieldFromRow(row, ["registrationstatus", "status", "paymentstatus"], "text").toUpperCase();
        const validStatuses: Registration["status"][] = ["CONFIRMED", "PAYMENT_PENDING", "ATTENDED", "CANCELLED"];
        const status = validStatuses.includes(statusRaw as any) ? (statusRaw as any) : "CONFIRMED";

        // Check if event title in row matches an event
        const eventTitleInRow = extractFieldFromRow(row, ["eventtitle", "event", "eventname"], "text");
        let rowEventId = targetEventId;
        if (eventTitleInRow) {
          const matchedEvt = events.find(
            (ev) =>
              ev.title.toLowerCase() === eventTitleInRow.toLowerCase() ||
              ev.slug.toLowerCase().includes(eventTitleInRow.toLowerCase())
          );
          if (matchedEvt) rowEventId = matchedEvt.id;
        }

        // Deduplicate inside spreadsheet itself
        const inSheetKey = teamName ? `${rowEventId}_team_${teamName.toLowerCase().trim()}` : `${rowEventId}_${email.toLowerCase()}`;
        if (sheetSeen.has(inSheetKey)) {
          continue;
        }
        sheetSeen.add(inSheetKey);

        // Check if attendee / team is already registered for this event
        const existingReg = registrations.find(
          (r) =>
            r.eventId === rowEventId &&
            ((teamName && r.teamName && r.teamName.toLowerCase().trim() === teamName.toLowerCase().trim()) ||
              (r.email && r.email.toLowerCase() === email.toLowerCase()) ||
              (rollNumber && r.rollNumber && r.rollNumber !== "N/A" && r.rollNumber.toUpperCase() === rollNumber.toUpperCase()))
        );

        if (existingReg) {
          // Update existing attendee with imported phone / roll number / degree / team
          const updatedReg: Registration = {
            ...existingReg,
            fullName: fullName || existingReg.fullName,
            phone: (phone && phone !== "0300-0000000") ? phone : existingReg.phone,
            rollNumber: (rollNumber && rollNumber !== "N/A") ? rollNumber : existingReg.rollNumber,
            department: department || existingReg.department,
            degreeProgram: degreeProgram || existingReg.degreeProgram,
            isIeeeMember: isIeeeMember || existingReg.isIeeeMember,
            ieeeMembershipNumber: ieeeNo || existingReg.ieeeMembershipNumber,
            teamName: teamName || existingReg.teamName,
            projectTitle: projectTitle || existingReg.projectTitle,
            teamMembers: parsedMembers.length > 0 ? parsedMembers : existingReg.teamMembers,
            memberCount: parsedMembers.length > 0 ? parsedMembers.length : existingReg.memberCount,
            projectDomain: projectDomain || existingReg.projectDomain,
            projectSummary: projectSummary || existingReg.projectSummary,
            posterUrl: posterUrl || existingReg.posterUrl,
            videoDemoUrl: videoDemoUrl || existingReg.videoDemoUrl,
            teamLeaderPhone: leaderPhone || existingReg.teamLeaderPhone,
            teamLeaderCnic: leaderCnic || existingReg.teamLeaderCnic,
            semester: semester || existingReg.semester,
            city: city || existingReg.city,
            receiptId: receiptId || existingReg.receiptId,
            bankName: bankName || existingReg.bankName,
            prizeBankName: prizeBankName || existingReg.prizeBankName,
            prizeAccountNumber: prizeAccountNumber || existingReg.prizeAccountNumber,
          };
          await db.addRegistration(updatedReg);
          updatedCount++;
        } else {
          // Create new attendee / team registration
          const ticketCode = ticketRaw || `TCK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const regItem: Registration = {
            id: `reg-import-${Date.now()}-${idx}`,
            eventId: rowEventId,
            privateToken: `priv-${Math.random().toString(36).substring(2, 12)}`,
            fullName,
            namePreference: "FULL_NAME",
            email,
            phone,
            rollNumber: rollNumber || "N/A",
            department,
            degreeProgram: degreeProgram || undefined,
            isIeeeMember,
            ieeeMembershipNumber: ieeeNo || undefined,
            photoConsent: true,
            status,
            ticketCode,
            teamName: teamName || undefined,
            projectTitle: projectTitle || undefined,
            teamMembers: parsedMembers.length > 0 ? parsedMembers : undefined,
            memberCount: parsedMembers.length > 0 ? parsedMembers.length : (teamName ? 2 : undefined),
            projectDomain: projectDomain || undefined,
            projectSummary: projectSummary || undefined,
            posterUrl: posterUrl || undefined,
            videoDemoUrl: videoDemoUrl || undefined,
            teamLeaderPhone: leaderPhone || undefined,
            teamLeaderCnic: leaderCnic || undefined,
            semester: semester || undefined,
            city: city || undefined,
            receiptId: receiptId || undefined,
            bankName: bankName || undefined,
            prizeBankName: prizeBankName || undefined,
            prizeAccountNumber: prizeAccountNumber || undefined,
            createdAt: new Date().toISOString(),
          };

          await db.addRegistration(regItem);

          // If receipt ID or bank is provided, add to payment queue
          if (receiptId || bankName) {
            const payScreenshot = extractFieldFromRow(row, ["paymentscreenshot", "screenshot", "receiptimage", "proof"], "text") || "";
            const currentEvt = events.find((e) => e.id === rowEventId);
            db.addPayment({
              id: `pay-${Date.now()}-${idx}`,
              registrationId: regItem.id,
              recipientName: fullName,
              eventTitle: currentEvt?.title || "UCET IUB Event",
              amountPkr: depositedAmount || 1000,
              paymentMethod: (bankName && bankName.toLowerCase().includes("easy")) ? "EasyPaisa / JazzCash" : (bankName && bankName.toLowerCase().includes("jazz")) ? "EasyPaisa / JazzCash" : "Bank Transfer",
              transactionId: receiptId || `TID-${Date.now()}`,
              proofImageUrl: payScreenshot,
              status: "VERIFIED",
              createdAt: new Date().toISOString(),
            });
          }

          newCount++;
        }
      }

      if (newCount === 0 && updatedCount === 0) {
        alert("No valid attendee records could be parsed. Please check spreadsheet headers.");
        return;
      }

      db.addAuditLog(
        "Muhammad Roshan Ashraf",
        "BULK_REGISTRATIONS_IMPORTED",
        "registrations",
        targetEventId,
        `Processed spreadsheet "${file.name}": added ${newCount} new registrations, updated ${updatedCount} existing attendee details.`
      );

      await loadData();
      alert(`Success! Successfully processed spreadsheet "${file.name}":\n• ${newCount} new attendee(s) added\n• ${updatedCount} existing attendee(s) updated with roll/phone details.`);
    } catch (err: any) {
      console.error("Sheet import error:", err);
      alert("Failed to import sheet: " + (err?.message || "Invalid file format."));
    } finally {
      setIsImporting(false);
    }
  };

  // Filter Registrations
  const filteredRegistrations = registrations.filter((r) => {
    const matchesEvent = selectedEventId === "ALL" || r.eventId === selectedEventId;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesProfession =
      professionFilter === "ALL" ||
      (professionFilter === "STUDENT"
        ? !r.profession || r.profession === "STUDENT"
        : r.profession === professionFilter);

    const query = searchQuery.toLowerCase().trim();
    const ev = eventMap.get(r.eventId);
    const queryClean = query.replace(/[^a-z0-9]/g, "");
    const matchesSearch =
      !query ||
      r.fullName.toLowerCase().includes(query) ||
      (r.rollNumber && r.rollNumber.toLowerCase().includes(query)) ||
      (r.cnic && (r.cnic.toLowerCase().includes(query) || (queryClean && r.cnic.replace(/[^0-9]/g, "").includes(queryClean)))) ||
      (r.passport && r.passport.toLowerCase().includes(query)) ||
      (r.identityNumber && r.identityNumber.toLowerCase().includes(query)) ||
      (r.teamName && r.teamName.toLowerCase().includes(query)) ||
      (r.projectTitle && r.projectTitle.toLowerCase().includes(query)) ||
      r.email.toLowerCase().includes(query) ||
      (r.phone && r.phone.toLowerCase().includes(query)) ||
      (r.ticketCode && r.ticketCode.toLowerCase().includes(query)) ||
      (r.department && r.department.toLowerCase().includes(query)) ||
      (r.organization && r.organization.toLowerCase().includes(query)) ||
      (r.designation && r.designation.toLowerCase().includes(query)) ||
      (r.degreeProgram && r.degreeProgram.toLowerCase().includes(query)) ||
      (ev && ev.title.toLowerCase().includes(query));

    return matchesEvent && matchesStatus && matchesProfession && matchesSearch;
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
            {/* Hidden file input for Excel / CSV import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportSheet}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-3.5 py-2 border border-blue-300 bg-blue-50 text-blue-900 text-xs font-semibold rounded-lg hover:bg-blue-100 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              title="Import attendees from an Excel (.xlsx/.xls) or CSV spreadsheet"
            >
              <Upload size={14} className="text-ieee-blue" />
              {isImporting ? "Importing Sheet..." : "Import Excel / CSV"}
            </button>

            <button
              onClick={handleDeduplicate}
              className="px-3.5 py-2 border border-purple-300 bg-purple-50 text-purple-900 text-xs font-semibold rounded-lg hover:bg-purple-100 flex items-center gap-1.5 shadow-xs transition-colors"
              title="Scan, merge, and clean duplicate registrations"
            >
              <Sparkles size={14} className="text-purple-600" /> Clean Duplicates
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 shadow-xs transition-colors"
              title="Export all filtered registrations to Excel sheet"
            >
              <Download size={14} className="text-emerald-700" /> Export Excel (.xlsx)
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-1.5 shadow-xs transition-colors"
              title="Export all filtered registrations to CSV"
            >
              <FileSpreadsheet size={14} className="text-gray-600" /> Export CSV
            </button>

            <button
              onClick={() => loadData()}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              title="Refresh and sync latest registrations from database"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-ieee-blue" : "text-gray-600"} /> Refresh
            </button>

            <button
              onClick={handleClearAll}
              disabled={isLoading || registrations.length === 0}
              className="px-3 py-2 border border-red-300 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
              title="Clear all registrations from database and cache"
            >
              <Trash2 size={14} className="text-red-600" /> Clear Data
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-ieee-navy hover:bg-ieee-blue text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Add Registration
            </button>
          </div>
        </div>

        {/* Database RLS Permission Notification Banner if Supabase SELECT is write-only */}
        {dbPermissionDenied && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 text-sm">
                  Cloud Cross-Device Sync Locked in Supabase
                </p>
                <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                  Attendee registrations submitted from external devices and public event pages are saved to the Supabase database, but public SELECT is restricted by Row-Level Security (RLS). Run this 4-line SQL grant in your Supabase SQL Editor to enable live cross-device sync.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;\nGRANT ALL ON public.registrations TO anon, authenticated, service_role;\nDROP POLICY IF EXISTS "Allow all registrations access" ON public.registrations;\nCREATE POLICY "Allow all registrations access" ON public.registrations FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);\nNOTIFY pgrst, 'reload schema';`);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-amber-800" />}
                {copiedSql ? "Copied SQL!" : "Copy SQL Fix"}
              </button>
              <a
                href="https://supabase.com/dashboard/project/gbuafbcebcbwzvefqhcr/sql"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                Open SQL Editor <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </a>
            </div>
          </div>
        )}

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
                  className={`px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${statusFilter === tab.id
                      ? "bg-ieee-navy text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profession / Category Dropdown Filter */}
            <div className="w-full sm:w-40">
              <select
                value={professionFilter}
                onChange={(e) => setProfessionFilter(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs font-montserrat font-bold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-ieee-blue"
              >
                <option value="ALL">All Categories</option>
                <option value="STUDENT">🎓 Students Only</option>
                <option value="INDUSTRIAL">💼 Industry Only</option>
                <option value="OTHER">🌐 Other / Faculty</option>
              </select>
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
            <div>
              <div className="md:hidden px-4 py-1.5 bg-sky-50 border-b border-sky-100 text-[11px] text-ieee-blue flex items-center justify-between">
                <span>↔ Scroll horizontally to view team details &amp; actions</span>
                <span className="font-semibold">{filteredRegistrations.length} registrations</span>
              </div>
              <div className="overflow-x-auto custom-scrollbar w-full">
                <table className="w-full min-w-[850px] text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 font-montserrat font-bold text-gray-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Participant / Team & Project Information</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">Program & Department</th>
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
                          {reg.teamName ? (
                            <div className="space-y-1.5 max-w-md">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wide font-montserrat uppercase">
                                  TEAM PROJECT
                                </span>
                                {reg.projectDomain && (
                                  <span className="bg-blue-50 text-ieee-blue border border-blue-200 font-bold px-2 py-0.5 rounded text-[10px]">
                                    {reg.projectDomain}
                                  </span>
                                )}
                              </div>

                              <div className="font-montserrat font-extrabold text-base text-ieee-navy leading-tight">
                                {reg.teamName}
                              </div>

                              {reg.projectTitle && (
                                <div className="text-xs font-semibold text-ieee-blue">
                                  <span className="text-gray-500 font-normal">Project: </span>
                                  {reg.projectTitle}
                                </div>
                              )}

                              <div className="text-[11px] text-gray-700">
                                <span className="font-bold text-gray-900">Leader: </span>
                                {reg.fullName}
                                {reg.phone && reg.phone !== "0300-0000000" && (
                                  <span className="text-gray-500 font-mono"> ({reg.phone})</span>
                                )}
                                {reg.email && !reg.email.includes("ucet.iub.edu.pk") && (
                                  <span className="text-gray-500"> • {reg.email}</span>
                                )}
                              </div>

                              {reg.teamMembers && reg.teamMembers.length > 0 && (
                                <div className="pt-1 border-t border-gray-100 flex flex-wrap items-center gap-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-0.5">
                                    Members ({reg.teamMembers.length}):
                                  </span>
                                  {reg.teamMembers.map((m, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200"
                                    >
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {reg.posterUrl && (
                                  <a
                                    href={reg.posterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded transition-colors"
                                  >
                                    Poster ↗
                                  </a>
                                )}
                                {reg.videoDemoUrl && (
                                  <a
                                    href={reg.videoDemoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors"
                                  >
                                    Video Demo ↗
                                  </a>
                                )}
                                {reg.projectSummary && (
                                  <button
                                    onClick={() =>
                                      setSelectedProjectSummary({
                                        title: `${reg.teamName} — ${reg.projectTitle || "Project Summary"}`,
                                        text: reg.projectSummary!,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                  >
                                    Abstract
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-montserrat font-bold text-ieee-navy text-sm">
                                {reg.fullName}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                                {reg.passport || reg.identityType === "PASSPORT" ? (
                                  <span className="font-mono text-purple-800 font-bold bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-[10px]">
                                    🛂 PASS: {reg.passport || reg.identityNumber}
                                  </span>
                                ) : reg.cnic || reg.identityType === "CNIC" ? (
                                  <span className="font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                    🪪 CNIC: {reg.cnic || reg.identityNumber}
                                  </span>
                                ) : reg.rollNumber && reg.rollNumber !== "N/A" ? (
                                  <span className="font-mono text-ieee-navy font-semibold bg-gray-100 px-1.5 py-0.5 rounded uppercase text-[10px]">
                                    🎓 ROLL: {reg.rollNumber}
                                  </span>
                                ) : null}
                                <span>{reg.email}</span>
                                {reg.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{reg.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
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
                          {/* Profession / Category Badge */}
                          <div className="flex items-center gap-1.5 mb-1">
                            {reg.profession === "INDUSTRIAL" ? (
                              <span className="bg-blue-100 text-blue-900 border border-blue-200 font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-montserrat">
                                💼 INDUSTRY
                              </span>
                            ) : reg.profession === "OTHER" ? (
                              <span className="bg-purple-100 text-purple-900 border border-purple-200 font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-montserrat">
                                🌐 OTHER
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-montserrat">
                                🎓 STUDENT
                              </span>
                            )}
                          </div>

                          {reg.degreeProgram ? (
                            <div className="font-semibold text-gray-900">{reg.degreeProgram}</div>
                          ) : null}
                          <div className="text-[11px] text-gray-500">{reg.organization || reg.department || "Computer Science"}</div>
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
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-montserrat font-bold ${reg.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : reg.status === "ATTENDED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : reg.status === "PAYMENT_PENDING"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${reg.status === "CONFIRMED"
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

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
                {/* Profession / Category Segmented Buttons */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">Participant Category</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditProfession("STUDENT")}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        editProfession === "STUDENT"
                          ? "bg-ieee-navy text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🎓 Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditProfession("INDUSTRIAL")}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        editProfession === "INDUSTRIAL"
                          ? "bg-ieee-navy text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      💼 Industry
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditProfession("OTHER")}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        editProfession === "OTHER"
                          ? "bg-ieee-navy text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🌐 Other
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Full Name (as on certificate) *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-medium"
                  />
                </div>

                {/* Identification Document Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-gray-700">Identification Document</label>
                    <span className="text-[10px] text-gray-400">Used for certificate verification</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-lg mb-2">
                    <button
                      type="button"
                      onClick={() => setEditIdentityType("ROLL_NUMBER")}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-md transition-all ${
                        editIdentityType === "ROLL_NUMBER"
                          ? "bg-white text-ieee-navy shadow-xs font-extrabold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🎓 Roll No
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIdentityType("CNIC")}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-md transition-all ${
                        editIdentityType === "CNIC"
                          ? "bg-white text-ieee-navy shadow-xs font-extrabold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🪪 CNIC
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIdentityType("PASSPORT")}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-md transition-all ${
                        editIdentityType === "PASSPORT"
                          ? "bg-white text-ieee-navy shadow-xs font-extrabold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🛂 Passport
                    </button>
                  </div>

                  <input
                    type="text"
                    value={editIdentityNumber}
                    onChange={(e) => setEditIdentityNumber(e.target.value.toUpperCase())}
                    placeholder={
                      editIdentityType === "ROLL_NUMBER"
                        ? "e.g. S23BINCE1M40414"
                        : editIdentityType === "CNIC"
                        ? "e.g. 31202-1234567-1"
                        : "e.g. PK1234567"
                    }
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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

                {/* Conditional Fields: Student vs Industry vs Other */}
                {editProfession === "STUDENT" && (
                  <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                    <p className="text-[11px] font-bold text-ieee-navy uppercase tracking-wider">🎓 Academic Affiliation</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Department / Faculty</label>
                        <input
                          type="text"
                          value={editDept}
                          onChange={(e) => setEditDept(e.target.value)}
                          placeholder="e.g. Computer Science & IT / UCET"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Degree / Program</label>
                        <input
                          type="text"
                          value={editDegreeProgram}
                          onChange={(e) => setEditDegreeProgram(e.target.value)}
                          placeholder="e.g. BS Computer Science"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Semester</label>
                        <select
                          value={editSemester}
                          onChange={(e) => setEditSemester(e.target.value)}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-semibold"
                        >
                          <option value="1st Semester">1st Semester</option>
                          <option value="2nd Semester">2nd Semester</option>
                          <option value="3rd Semester">3rd Semester</option>
                          <option value="4th Semester">4th Semester</option>
                          <option value="5th Semester">5th Semester</option>
                          <option value="6th Semester">6th Semester</option>
                          <option value="7th Semester">7th Semester</option>
                          <option value="8th Semester">8th Semester</option>
                          <option value="Graduated / Alumni">Graduated / Alumni</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">University / Institute</label>
                        <input
                          type="text"
                          value={editUniversity}
                          onChange={(e) => setEditUniversity(e.target.value)}
                          placeholder="e.g. The Islamia University of Bahawalpur"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editProfession === "INDUSTRIAL" && (
                  <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                    <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">💼 Professional Affiliation</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Company / Organization *</label>
                        <input
                          type="text"
                          value={editOrganization}
                          onChange={(e) => setEditOrganization(e.target.value)}
                          placeholder="e.g. Systems Limited, Devsinc, Freelance"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Designation / Job Title *</label>
                        <input
                          type="text"
                          value={editDesignation}
                          onChange={(e) => setEditDesignation(e.target.value)}
                          placeholder="e.g. Senior Software Engineer"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editProfession === "OTHER" && (
                  <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                    <p className="text-[11px] font-bold text-purple-950 uppercase tracking-wider">🌐 Institutional / Guest Affiliation</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Organization / Department *</label>
                        <input
                          type="text"
                          value={editOrganization}
                          onChange={(e) => setEditOrganization(e.target.value)}
                          placeholder="e.g. Faculty of Computing, IUB"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Role / Designation *</label>
                        <input
                          type="text"
                          value={editDesignation}
                          onChange={(e) => setEditDesignation(e.target.value)}
                          placeholder="e.g. Assistant Professor, Researcher"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                    <Plus size={18} className="text-ieee-blue" /> Add Event Registration
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Manual attendee registration for students, industry professionals, or guests.
                  </p>
                </div>
                <button onClick={() => !isAdding && setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs max-h-[80vh] overflow-y-auto pr-1">
                {/* Event Selector */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Target Event *</label>
                  <select
                    value={addEventId}
                    onChange={(e) => setAddEventId(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-semibold text-xs"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Participant Category: 3 Segments */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">Participant Category *</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAddProfession("STUDENT");
                        setAddIdentityType("ROLL_NUMBER");
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        addProfession === "STUDENT"
                          ? "bg-ieee-navy text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🎓 Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddProfession("INDUSTRIAL");
                        setAddIdentityType("CNIC");
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        addProfession === "INDUSTRIAL"
                          ? "bg-ieee-navy text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      💼 Industry
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddProfession("OTHER");
                        setAddIdentityType("CNIC");
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        addProfession === "OTHER"
                          ? "bg-ieee-navy text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🌐 Other
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Full Name (as to appear on certificate) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Roshan Ashraf"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                {/* Document Type Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-gray-700">Identification Document *</label>
                    <span className="text-[10px] text-gray-400">Printed on verified credential</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-lg mb-2">
                    <button
                      type="button"
                      onClick={() => setAddIdentityType("ROLL_NUMBER")}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-md transition-all ${
                        addIdentityType === "ROLL_NUMBER"
                          ? "bg-white text-ieee-navy shadow-xs font-extrabold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🎓 Roll No
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddIdentityType("CNIC")}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-md transition-all ${
                        addIdentityType === "CNIC"
                          ? "bg-white text-ieee-navy shadow-xs font-extrabold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🪪 CNIC
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddIdentityType("PASSPORT")}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-md transition-all ${
                        addIdentityType === "PASSPORT"
                          ? "bg-white text-ieee-navy shadow-xs font-extrabold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🛂 Passport
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={addIdentityNumber}
                    onChange={(e) => setAddIdentityNumber(e.target.value.toUpperCase())}
                    placeholder={
                      addIdentityType === "ROLL_NUMBER"
                        ? "e.g. S23BINCE1M40414"
                        : addIdentityType === "CNIC"
                        ? "e.g. 31202-1234567-1"
                        : "e.g. PK1234567"
                    }
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-mono uppercase"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. attendee@gmail.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Phone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 03001234567"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                    />
                  </div>
                </div>

                {/* Conditional Fields: Student vs Industry vs Other */}
                {addProfession === "STUDENT" && (
                  <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                    <p className="text-[11px] font-bold text-ieee-navy uppercase tracking-wider">🎓 Academic Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Department / Faculty *</label>
                        <input
                          type="text"
                          required
                          value={addDept}
                          onChange={(e) => setAddDept(e.target.value)}
                          placeholder="e.g. Computer Science & IT / UCET"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Program / Degree *</label>
                        <input
                          type="text"
                          required
                          value={addDegreeProgram}
                          onChange={(e) => setAddDegreeProgram(e.target.value)}
                          placeholder="e.g. BS Computer Science"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Semester</label>
                        <select
                          value={addSemester}
                          onChange={(e) => setAddSemester(e.target.value)}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-semibold"
                        >
                          <option value="1st Semester">1st Semester</option>
                          <option value="2nd Semester">2nd Semester</option>
                          <option value="3rd Semester">3rd Semester</option>
                          <option value="4th Semester">4th Semester</option>
                          <option value="5th Semester">5th Semester</option>
                          <option value="6th Semester">6th Semester</option>
                          <option value="7th Semester">7th Semester</option>
                          <option value="8th Semester">8th Semester</option>
                          <option value="Graduated / Alumni">Graduated / Alumni</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">University / Institute</label>
                        <input
                          type="text"
                          value={addUniversity}
                          onChange={(e) => setAddUniversity(e.target.value)}
                          placeholder="e.g. The Islamia University of Bahawalpur"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addProfession === "INDUSTRIAL" && (
                  <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                    <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">💼 Professional Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Company / Organization *</label>
                        <input
                          type="text"
                          required
                          value={addOrganization}
                          onChange={(e) => setAddOrganization(e.target.value)}
                          placeholder="e.g. Systems Limited, Devsinc, Freelance"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Job Title / Designation *</label>
                        <input
                          type="text"
                          required
                          value={addDesignation}
                          onChange={(e) => setAddDesignation(e.target.value)}
                          placeholder="e.g. Senior Software Engineer"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addProfession === "OTHER" && (
                  <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                    <p className="text-[11px] font-bold text-purple-950 uppercase tracking-wider">🌐 Institutional / Guest Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Organization / Department *</label>
                        <input
                          type="text"
                          required
                          value={addOrganization}
                          onChange={(e) => setAddOrganization(e.target.value)}
                          placeholder="e.g. Faculty of Computing, IUB"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700 block mb-1">Role / Designation *</label>
                        <input
                          type="text"
                          required
                          value={addDesignation}
                          onChange={(e) => setAddDesignation(e.target.value)}
                          placeholder="e.g. Assistant Professor, Researcher"
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Selector */}
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

                {/* IEEE Member checkbox */}
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
        {/* Project Summary Modal */}
        {selectedProjectSummary && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-2xl w-full p-6 space-y-4 border border-gray-200 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                  <Sparkles size={16} className="text-ieee-orange" /> {selectedProjectSummary.title}
                </h3>
                <button
                  onClick={() => setSelectedProjectSummary(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-1">
                <div className="text-xs leading-relaxed text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg border font-sans">
                  {selectedProjectSummary.text}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button
                  onClick={() => setSelectedProjectSummary(null)}
                  className="px-4 py-2 bg-ieee-navy text-white text-xs font-semibold rounded-lg hover:bg-ieee-blue transition-colors"
                >
                  Close Abstract
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

