"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { EventItem, AttendanceRecord, CertificateRecord, CertificateTemplate } from "@/types";
import { generateCertificatePdf } from "@/lib/certificatePdf";
import { generateCertificateCode } from "@/lib/codeGenerator";
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
} from "lucide-react";

export default function AdminAttendancePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [filterMode, setFilterMode] = useState<"ALL" | "ATTENDED" | "ABSENT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeneratingPdfs, setIsGeneratingPdfs] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
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
      const allTpls = await db.fetchTemplates();
      setTemplates(allTpls);
      const activeTpl = await db.fetchActiveTemplate();
      if (activeTpl) setSelectedTemplateId(activeTpl.id);
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

      for (let idx = 0; idx < jsonRows.length; idx++) {
        const row = jsonRows[idx];
        const name = String(row["Name"] || row["name"] || row["Full Name"] || row["Student Name"] || `Participant ${idx + 1}`).trim();
        const rollNumber = String(row["Roll Number"] || row["Roll No"] || row["rollNumber"] || row["Registration No"] || "").trim();
        const email = String(row["Email"] || row["email"] || "").trim();
        const attendedRaw = String(row["Attended"] || row["Status"] || row["attended"] || "Yes").toLowerCase();
        const attended = attendedRaw.includes("yes") || attendedRaw.includes("present") || attendedRaw.includes("1") || attendedRaw.includes("true");

        const normName = name.toLowerCase();
        const normRoll = rollNumber.toLowerCase();
        const normEmail = email.toLowerCase();

        // Check if existing code exists for this participant
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

          // Permanently record/upsert the certificate in DB so it is live and verifiable
          const certRecord: CertificateRecord = {
            id: `cert-${Date.now()}-${idx}`,
            code: assignedCode,
            recipientName: name,
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
            templateId: selectedTemplateId || undefined,
            createdAt: new Date().toISOString(),
          };
          await db.addCertificate(certRecord);
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
        `• Existing Codes Preserved: ${preservedCount} (codes remain permanent)\n` +
        `• New Certificates Issued: ${newlyIssuedCount}\n` +
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
    const currentEvent = events.find((e) => e.id === selectedEventId);
    const eventName = currentEvent?.title || "this event";

    if (
      !confirm(
        `DANGER / DATA WIPE:\n\nAre you sure you want to permanently clear all attendance records and certificates for:\n"${eventName}"?\n\nThis will wipe the data from the database so you can upload fresh records.`
      )
    ) {
      return;
    }

    try {
      await db.clearEventAttendanceAndCertificates(selectedEventId, currentEvent?.title);
      setAttendanceList([]);
      alert(`All attendance records and certificates for "${eventName}" have been completely wiped! You can now upload a fresh attendance sheet.`);
    } catch (err: any) {
      alert("Failed to clear data: " + err.message);
    }
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

  // Download Single PDF
  const handleDownloadSinglePdf = async (rec: AttendanceRecord) => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent) return;

    const certCode = rec.certificateCode || generateCertificateCode("26");
    const certRecord: CertificateRecord = {
      id: `cert-${Date.now()}`,
      code: certCode,
      recipientName: rec.name,
      publicNameFormat: "FULL_NAME",
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      certificateType: currentEvent.certificateType || "Certificate of Participation",
      recognitionLevel: "CHAPTER_RECOGNITION",
      issuerStatement: "This is an official chapter recognition issued by IEEE CS UCET-IUB Student Branch Chapter.",
      activityDate: currentEvent.startDate.split("T")[0],
      issueDate: new Date().toISOString().split("T")[0],
      approverName: "Muhammad Roshan Ashraf",
      approverRole: "Chapter Administrator",
      status: "ACTIVE",
      source: "IN_SITE_GENERATED",
      templateId: selectedTemplateId || undefined,
      createdAt: new Date().toISOString(),
    };

    // Save to database
    db.addCertificate(certRecord);

    window.open(`/verify/${certCode}/certificate?print=true`, "_blank");
  };

  // Bulk Generate All Attended Certificates as ZIP
  const handleBulkGenerateZip = async () => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent) return;

    const attendedRecords = attendanceList.filter((r) => r.attended);
    if (attendedRecords.length === 0) {
      alert("No participants are marked as 'Attended'. Please mark attendees before generating certificates.");
      return;
    }

    setIsGeneratingPdfs(true);
    setGenerationProgress(`Starting PDF generation for ${attendedRecords.length} attendees...`);

    try {
      const zip = new JSZip();
      const today = new Date().toISOString().split("T")[0];

      for (let i = 0; i < attendedRecords.length; i++) {
        const rec = attendedRecords[i];
        setGenerationProgress(`Rendering PDF (${i + 1}/${attendedRecords.length}): ${rec.name}`);

        const code = rec.certificateCode || generateCertificateCode("26");
        rec.certificateCode = code;

        const certRecord: CertificateRecord = {
          id: `cert-${Date.now()}-${i}`,
          code,
          recipientName: rec.name,
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
          templateId: selectedTemplateId || undefined,
          createdAt: new Date().toISOString(),
        };

        // Add to registry database
        db.addCertificate(certRecord);

        // Render PDF
        const pdfDoc = await generateCertificatePdf(certRecord);
        const pdfBlob = pdfDoc.output("blob");
        const filename = `${code}_${rec.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
        zip.file(filename, pdfBlob);
      }

      setGenerationProgress("Compressing ZIP archive...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `IEEE_CS_Certificates_${currentEvent.slug.replace(/\//g, "_")}.zip`;
      a.click();

      // Update stored codes in attendance
      db.saveAttendance(selectedEventId, attendanceList);
      setAttendanceList([...attendanceList]);

      db.addAuditLog(
        "Muhammad Roshan Ashraf",
        "BULK_CERTIFICATES_GENERATED",
        "events",
        selectedEventId,
        `Generated and exported ${attendedRecords.length} PDF certificates in ZIP archive for "${currentEvent.title}".`
      );

      alert(`Success! Generated and downloaded ${attendedRecords.length} certificates in ZIP pack.`);
    } catch (err) {
      console.error(err);
      alert("An error occurred during bulk generation.");
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
      (filterMode === "ABSENT" && !item.attended);

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.rollNumber && item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.certificateCode && item.certificateCode.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const attendedCount = attendanceList.filter((r) => r.attended).length;
  const currentEvent = events.find((e) => e.id === selectedEventId);

  return (
    <AdminLayout>
      <div className="space-y-8 font-openSans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider">
              <Users size={16} /> Attendance & Certification Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
              Attendance Sheet & Bulk PDF Generator
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Upload attendance sheets (Excel/CSV), mark attendees, and generate official verifiable certificates in bulk.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 border border-ieee-blue bg-ieee-surfaceTint/50 text-ieee-navy text-xs font-semibold rounded-lg hover:bg-ieee-surfaceTint flex items-center gap-1.5 shadow-sm"
            >
              <Upload size={14} className="text-ieee-blue" /> Upload Excel / CSV Sheet
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} /> Export Excel
            </button>

            <button
              onClick={handleClearEventData}
              className="px-3.5 py-2 border border-red-200 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 flex items-center gap-1.5 shadow-sm transition-colors"
              title="Permanently wipe attendance records and certificates for this event"
            >
              <Trash2 size={14} className="text-red-600" /> Clear / Wipe Event Data
            </button>

            <Button
              onClick={handleBulkGenerateZip}
              variant="accent"
              disabled={isGeneratingPdfs || attendedCount === 0}
              className="flex items-center gap-1.5 shadow-md"
            >
              <Sparkles size={15} />
              {isGeneratingPdfs ? "Generating ZIP..." : `Generate ${attendedCount} PDFs (.zip)`}
            </Button>
          </div>
        </div>

        {/* Generation Progress Bar */}
        {isGeneratingPdfs && (
          <div className="p-4 bg-ieee-surfaceTint border border-ieee-blue rounded-card space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-ieee-navy">
              <span>{generationProgress}</span>
              <RefreshCw size={14} className="animate-spin text-ieee-blue" />
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-ieee-orange h-full animate-pulse w-full"></div>
            </div>
          </div>
        )}

        {/* Event Selector, Template Selector & Stats */}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-montserrat font-bold text-gray-700 uppercase tracking-wider block">
                    Certificate Template:
                  </label>
                  <a
                    href="/admin/templates"
                    target="_blank"
                    className="text-[11px] font-bold text-ieee-blue hover:underline"
                  >
                    Edit Studio ↗
                  </a>
                </div>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs font-montserrat font-bold text-ieee-navy bg-white focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.isDefault ? "★ (Active Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {currentEvent && (
              <div className="text-[11px] text-gray-500 flex flex-wrap gap-4 pt-1 border-t border-gray-100">
                <span>Date: <strong>{new Date(currentEvent.startDate).toLocaleDateString()}</strong></span>
                <span>Venue: <strong>{currentEvent.venue}</strong></span>
                <span>Cert Type: <strong>{currentEvent.certificateType}</strong></span>
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
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {[
              { id: "ALL", label: `All (${attendanceList.length})` },
              { id: "ATTENDED", label: `Attended (${attendedCount})` },
              { id: "ABSENT", label: `Absent (${attendanceList.length - attendedCount})` },
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
              placeholder="Search name, roll number, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
            />
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs">
              No attendance records found. Click "Upload Excel / CSV Sheet" to import participants!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 font-montserrat font-bold text-gray-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4 w-12 text-center">Status</th>
                    <th className="p-4">Participant Name</th>
                    <th className="p-4">Roll No & Email</th>
                    <th className="p-4">Verification Code</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredList.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
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

                      <td className="p-4 font-montserrat font-bold text-gray-800 text-sm">
                        {rec.name}
                      </td>

                      <td className="p-4 text-gray-600 space-y-0.5">
                        <div className="font-semibold text-ieee-navy">{rec.rollNumber || "No Roll No"}</div>
                        <div className="text-[11px] text-gray-400">{rec.email || "No Email"}</div>
                      </td>

                      <td className="p-4">
                        {rec.certificateCode ? (
                          <span className="font-mono font-bold text-ieee-blue bg-ieee-surfaceTint px-2 py-0.5 rounded text-[11px]">
                            {rec.certificateCode}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">
                            {rec.attended ? "Ready for Issuance" : "Mark attended to issue"}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDownloadSinglePdf(rec)}
                          disabled={!rec.attended}
                          className={`px-3 py-1.5 rounded text-xs font-semibold inline-flex items-center gap-1.5 ${
                            rec.attended
                              ? "bg-ieee-navy text-white hover:bg-ieee-blue shadow-sm"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <FileText size={13} />
                          <span>PDF Certificate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

