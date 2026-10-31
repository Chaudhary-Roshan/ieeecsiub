"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { EventItem } from "@/types";
import { Button } from "@/components/ui/Button";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  generateCertificatesAction,
  voidRunAction,
  GenerateWizardRow,
} from "@/app/actions/certificates";
import {
  Award,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  RotateCcw,
  ExternalLink,
  Layers,
  FileText,
  Search,
  Users,
} from "lucide-react";
import clsx from "clsx";

export default function CertificateWizardPage() {
  const router = useRouter();

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Event Selection
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Step 2: Data Source & Upload
  const [uploadMode, setUploadMode] = useState<"PERSON" | "TEAM">("PERSON");
  const [fileName, setFileName] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<GenerateWizardRow[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Step 3: Validation State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [readyCount, setReadyCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);

  // Step 4: Template Choice
  const [templateId, setTemplateId] = useState<string>("classic-simple");
  const [certificateType, setCertificateType] = useState<string>("Certificate of Participation");

  // Step 5: Generation & Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    success: boolean;
    runId: string;
    totalIssued: number;
    totalSkipped: number;
    issuedCertificates: { name: string; code: string; verifyUrl: string }[];
  } | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  // Load events on mount
  useEffect(() => {
    async function load() {
      const liveEvents = await db.fetchEvents();
      setEvents(liveEvents);
      if (liveEvents.length > 0) {
        setSelectedEventId(liveEvents[0].id);
        setSelectedEvent(liveEvents[0]);
        setCertificateType(liveEvents[0].certificateType || "Certificate of Participation");
      }
    }
    load();
  }, []);

  // Update selected event details
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setSelectedEvent(found);
      setCertificateType(found.certificateType || "Certificate of Participation");
    }
  };

  // Sample CSV generators
  const downloadSamplePersonCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "recipient_name,email,roll_number,attended,team_name,is_leader,project_title,placement\n" +
      "Muhammad Ali,ali@example.com,FA22-BSE-001,yes,CyberGuard,true,AI Network Sentinel,1st Position\n" +
      "Fatima Zahra,fatima@example.com,FA22-BSE-002,yes,CyberGuard,false,AI Network Sentinel,1st Position\n" +
      "Hamza Khan,hamza@example.com,FA22-BCS-045,yes,BioSensor,true,Smart Agriculture IoT,Participant\n" +
      "Usman Tariq,usman@example.com,FA22-BSE-019,no,BioSensor,false,Smart Agriculture IoT,Participant";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_person_roster.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleTeamCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "team_name,team_leader,members,project_title,placement\n" +
      "CyberGuard,Muhammad Ali,Fatima Zahra;Ahmed Hassan;Zainab Malik,AI Network Sentinel,1st Position\n" +
      "BioSensor IoT,Hamza Khan,Usman Tariq;Bilal Raza,Smart Agriculture IoT,2nd Position\n" +
      "RoboVision,Ayesha Noor,Sara Imran;Taha Siddiqui,Autonomous Navigation Rover,Participant";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_team_roster.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Upload (CSV or Excel)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    setFileName(file.name);

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);
          processRawRows(jsonRows);
        } catch (err: any) {
          alert("Failed to parse Excel file: " + err.message);
        } finally {
          setIsLoadingFile(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawRows(results.data as Record<string, any>[]);
          setIsLoadingFile(false);
        },
        error: (err) => {
          alert("Failed to parse CSV file: " + err.message);
          setIsLoadingFile(false);
        },
      });
    }
  };

  // Process and standardize raw rows into GenerateWizardRow
  const processRawRows = (rawRows: Record<string, any>[]) => {
    const standard: GenerateWizardRow[] = [];
    const errors: string[] = [];

    rawRows.forEach((r, idx) => {
      const name = r.recipient_name || r.name || r.Recipient || r.Name || r.team_leader || "";
      const teamName = r.team_name || r.Team || r.TeamName || "";
      const email = r.email || r.Email || "";
      const rollNumber = r.roll_number || r.RollNumber || r.roll || "";
      const isLeader = r.is_leader === true || r.is_leader === "true" || r.is_leader === "yes" || r.is_leader === "1";
      const projectTitle = r.project_title || r.Project || r.project || "";
      const placement = r.placement || r.position || r.Placement || "";
      
      const attendedVal = r.attended !== undefined ? String(r.attended).toLowerCase() : "yes";
      const attended = attendedVal !== "no" && attendedVal !== "false" && attendedVal !== "0";

      let members: string[] = [];
      if (r.members) {
        members = String(r.members).split(";").map((s) => s.trim()).filter(Boolean);
      }

      if (!name && !teamName) {
        errors.push(`Row ${idx + 1}: Missing recipient or team name.`);
      }

      standard.push({
        recipientName: name,
        email,
        rollNumber,
        teamName,
        isLeader,
        projectTitle,
        placement,
        members,
        attended,
      });
    });

    setParsedRows(standard);
    setValidationErrors(errors);

    const ready = standard.filter((s) => (s.recipientName || s.teamName) && s.attended !== false).length;
    const skipped = standard.filter((s) => s.attended === false).length;

    setReadyCount(ready);
    setSkippedCount(skipped);
    setCurrentStep(3); // Advance to Check step
  };

  // "Use Event Registrations" source
  const handleUseRegistrations = async () => {
    if (!selectedEvent) return;
    setIsLoadingFile(true);
    setFileName(`Event Registrations: ${selectedEvent.title}`);

    const regs = await db.fetchRegistrations(selectedEvent.id);
    const standard: GenerateWizardRow[] = regs.map((r) => ({
      recipientName: r.fullName,
      email: r.email,
      rollNumber: r.rollNumber || "",
      attended: r.status === "ATTENDED" || r.status === "CONFIRMED",
      teamName: "",
      projectTitle: "",
    }));

    setParsedRows(standard);
    setValidationErrors([]);
    setReadyCount(standard.filter((s) => s.attended).length);
    setSkippedCount(standard.filter((s) => !s.attended).length);
    setIsLoadingFile(false);
    setCurrentStep(3);
  };

  // Step 5: Execute generation Server Action
  const handleGenerate = async () => {
    if (!selectedEvent) {
      alert("Please select an event.");
      return;
    }

    if (parsedRows.length === 0) {
      alert("No recipients to generate certificates for.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateCertificatesAction({
        eventId: selectedEvent.id,
        eventName: selectedEvent.title,
        eventDate: selectedEvent.startDate || new Date().toISOString().slice(0, 10),
        eventYear: Number(selectedEvent.startDate?.slice(0, 4)) || new Date().getFullYear(),
        templateId,
        mode: uploadMode === "PERSON" ? "PER_PERSON" : "PER_TEAM",
        certificateType,
        rows: parsedRows,
      });

      setGenerationResult(res);
      setCurrentStep(5);
    } catch (err: any) {
      alert("Certificate generation failed: " + (err.message || String(err)));
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Codes CSV
  const downloadCodesCSV = () => {
    if (!generationResult) return;
    const header = "recipient_name,certificate_code,verify_url\n";
    const body = generationResult.issuedCertificates
      .map((c) => `"${c.name}","${c.code}","${c.verifyUrl}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `certificate_codes_${generationResult.runId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 24-Hour Undo Run
  const handleUndoRun = async () => {
    if (!generationResult) return;
    if (confirm("Are you sure you want to void this run? All certificates issued in this batch will immediately show as VOID (invalid) on public verification.")) {
      setIsVoiding(true);
      try {
        await voidRunAction(generationResult.runId);
        alert("Batch successfully voided! All certificates from this run are now marked invalid.");
        router.push("/admin/certificates");
      } catch (err: any) {
        alert("Void failed: " + err.message);
      } finally {
        setIsVoiding(false);
      }
    }
  };

  const templates = [
    {
      id: "classic-simple",
      title: "Design 1: Simple & Academic",
      category: "Individual & Workshop",
      description: "Clean IEEE blue border, official logos, and bold typography. Ideal for technical workshops.",
    },
    {
      id: "blue-panel",
      title: "Design 2: Blue Side Panel",
      category: "Professional & Merit",
      description: "Modern split-screen layout with royal blue sidebar, watermark binary grid, and high contrast.",
    },
    {
      id: "centered-binary",
      title: "Design 3: Centered Binary Band",
      category: "Technical & Symposium",
      description: "Centered formal certificate featuring bottom binary ribbon and double gold accent stripes.",
    },
    {
      id: "expo-winner",
      title: "Projects Expo: Winner Medal",
      category: "Teams & Placement",
      description: "Includes official gold medal insignia, team name, and individual team member roster tags.",
    },
    {
      id: "expo-participation",
      title: "Projects Expo: Team Participation",
      category: "Teams",
      description: "Recognizes project innovation with team leader and full roster breakdown.",
    },
    {
      id: "s1-volunteer",
      title: "Series 1: Volunteer Recognition",
      category: "Volunteers",
      description: "Celebrates organizing committee service with heart-shaped chapter volunteer medal.",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider mb-1">
              <Award size={14} /> Certificate Issuance Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
              Unified 5-Step Certificate Wizard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Generate tamper-proof IEEE CS certificates directly into PostgreSQL with atomic transactions and 24-hour undo.
            </p>
          </div>

          <Link href="/admin/certificates">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <ArrowLeft size={13} /> Back to Registry
            </Button>
          </Link>
        </div>

        {/* Wizard Stepper Tabs */}
        <div className="grid grid-cols-5 gap-2 border-b border-gray-200 pb-4 text-xs font-montserrat">
          {[
            { num: 1, label: "1. Select Event" },
            { num: 2, label: "2. Upload Data" },
            { num: 3, label: "3. Check & Validate" },
            { num: 4, label: "4. Template & Layout" },
            { num: 5, label: "5. Generate & Done" },
          ].map((st) => (
            <button
              key={st.num}
              onClick={() => {
                if (st.num < currentStep || (st.num === 4 && parsedRows.length > 0)) {
                  setCurrentStep(st.num);
                }
              }}
              disabled={st.num > currentStep && parsedRows.length === 0}
              className={clsx(
                "py-2.5 px-3 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1.5",
                currentStep === st.num
                  ? "bg-ieee-navy text-white shadow-sm"
                  : currentStep > st.num
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {currentStep > st.num ? <CheckCircle2 size={13} /> : null}
              <span>{st.label}</span>
            </button>
          ))}
        </div>

        {/* STEP 1: SELECT EVENT */}
        {currentStep === 1 && (
          <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-ieee-blue text-white text-xs flex items-center justify-center">1</span>
                Select Chapter Event
              </h2>
              <p className="text-xs text-gray-500">
                Choose the official event for which certificates are being issued. Details will auto-populate as defaults.
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Event from Database *
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-ieee-blue outline-none font-medium"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.startDate ? evt.startDate.slice(0, 10) : "Upcoming"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEvent && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                  <div className="font-bold text-ieee-navy text-sm">{selectedEvent.title}</div>
                  <div className="text-gray-600">
                    <strong>Date:</strong> {selectedEvent.startDate?.slice(0, 10)} | <strong>Venue:</strong> {selectedEvent.venue}
                  </div>
                  <div className="text-gray-600">
                    <strong>Default Certificate:</strong> {selectedEvent.certificateType}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Certificate Type (Title) *
                </label>
                <input
                  type="text"
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  placeholder="e.g. Certificate of Participation, Certificate of Merit"
                  className="w-full p-2.5 border rounded-lg text-xs focus:ring-1 focus:ring-ieee-blue outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedEventId}
                  variant="primary"
                  className="flex items-center gap-1.5 text-xs font-bold"
                >
                  Continue to Upload Data <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD DATA */}
        {currentStep === 2 && (
          <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-ieee-blue text-white text-xs flex items-center justify-center">2</span>
                Upload Recipients or Team Roster
              </h2>
              <p className="text-xs text-gray-500">
                Upload a spreadsheet (CSV or Excel) containing attendee names, or load attendees directly from event registrations.
              </p>
            </div>

            {/* Layout Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setUploadMode("PERSON")}
                className={clsx(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all",
                  uploadMode === "PERSON"
                    ? "border-ieee-blue bg-blue-50/40"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-ieee-navy flex items-center gap-1.5">
                    <Users size={14} className="text-ieee-blue" /> Option A: One Row Per Person (Recommended)
                  </span>
                  <input
                    type="radio"
                    name="mode"
                    checked={uploadMode === "PERSON"}
                    onChange={() => setUploadMode("PERSON")}
                  />
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  Each participant gets their own unique cryptographic code and verify link.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSamplePersonCSV();
                  }}
                  className="text-[11px] font-bold text-ieee-blue hover:underline flex items-center gap-1"
                >
                  <Download size={11} /> Download Sample Person CSV
                </button>
              </div>

              <div
                onClick={() => setUploadMode("TEAM")}
                className={clsx(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all",
                  uploadMode === "TEAM"
                    ? "border-ieee-blue bg-blue-50/40"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-ieee-navy flex items-center gap-1.5">
                    <Layers size={14} className="text-ieee-blue" /> Option B: One Row Per Team (Expo Roster)
                  </span>
                  <input
                    type="radio"
                    name="mode"
                    checked={uploadMode === "TEAM"}
                    onChange={() => setUploadMode("TEAM")}
                  />
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  Team certificate format with team name, leader, and semi-colon separated member roster.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleTeamCSV();
                  }}
                  className="text-[11px] font-bold text-ieee-blue hover:underline flex items-center gap-1"
                >
                  <Download size={11} /> Download Sample Team CSV
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 hover:border-ieee-blue rounded-2xl p-8 text-center transition-all bg-gray-50/50">
              <UploadCloud size={40} className="mx-auto text-ieee-blue mb-2 opacity-80" />
              <div className="text-sm font-bold text-gray-800">
                {isLoadingFile ? "Processing spreadsheet..." : "Choose CSV or Excel Spreadsheet (.xlsx, .csv)"}
              </div>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Drag and drop your file here or click to browse from your device
              </p>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-ieee-navy text-white rounded-lg text-xs font-bold hover:bg-ieee-blue transition-colors cursor-pointer shadow-sm">
                <FileSpreadsheet size={15} /> Select Spreadsheet File
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                  <CheckCircle2 size={13} /> {fileName}
                </div>
              )}
            </div>

            {/* Quick Option: Load from Event Check-ins */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Or generate directly from attendees who checked in to this event:
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseRegistrations}
                className="text-xs flex items-center gap-1.5"
              >
                <Users size={13} /> Use Event Registrations
              </Button>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button onClick={() => setCurrentStep(1)} variant="outline" size="sm" className="text-xs">
                <ArrowLeft size={13} /> Back
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CHECK & VALIDATE */}
        {currentStep === 3 && (
          <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-ieee-blue text-white text-xs flex items-center justify-center">3</span>
                Check & Validate Roster Data
              </h2>
              <p className="text-xs text-gray-500">
                Review verified recipients, identified errors, and excluded rows before proceeding to template styling.
              </p>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-2xl font-extrabold text-emerald-700">{readyCount}</div>
                <div className="text-xs font-bold text-emerald-900 mt-0.5">Ready to Issue</div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-2xl font-extrabold text-amber-700">{skippedCount}</div>
                <div className="text-xs font-bold text-amber-900 mt-0.5">Skipped (Unattended)</div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="text-2xl font-extrabold text-red-700">{validationErrors.length}</div>
                <div className="text-xs font-bold text-red-900 mt-0.5">Validation Errors</div>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1.5">
                <div className="font-bold flex items-center gap-1 text-red-900">
                  <AlertTriangle size={14} /> Issues detected in uploaded data:
                </div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {validationErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>...and {validationErrors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 font-bold text-gray-700">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Recipient / Team</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Project / Team</th>
                      <th className="p-2.5">Placement</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.slice(0, 25).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-2.5 text-gray-400 font-mono">{i + 1}</td>
                        <td className="p-2.5 font-bold text-ieee-navy">{row.recipientName || row.teamName}</td>
                        <td className="p-2.5 text-gray-500">{row.email || "-"}</td>
                        <td className="p-2.5 text-gray-600">{row.projectTitle || row.teamName || "-"}</td>
                        <td className="p-2.5 font-semibold text-ieee-orange">{row.placement || "Participant"}</td>
                        <td className="p-2.5">
                          {row.attended !== false ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Ready
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                              Skipped
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 25 && (
                <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-center text-[11px] text-gray-500 font-medium">
                  Showing first 25 of {parsedRows.length} total recipients
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button onClick={() => setCurrentStep(2)} variant="outline" size="sm" className="text-xs">
                <ArrowLeft size={13} /> Re-upload
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={readyCount === 0}
                variant="primary"
                size="sm"
                className="text-xs font-bold flex items-center gap-1.5"
              >
                Choose Template & Preview <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CHOOSE TEMPLATE & OUTPUT */}
        {currentStep === 4 && (
          <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-montserrat font-bold text-ieee-navy flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-ieee-blue text-white text-xs flex items-center justify-center">4</span>
                Select Official Certificate Template
              </h2>
              <p className="text-xs text-gray-500">
                Choose the design layout matched to your event type. All designs are strictly responsive A4 landscape.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setTemplateId(tpl.id)}
                  className={clsx(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                    templateId === tpl.id
                      ? "border-ieee-blue bg-blue-50/30 shadow-md ring-2 ring-ieee-blue/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                        {tpl.category}
                      </span>
                      <input
                        type="radio"
                        name="templateSelection"
                        checked={templateId === tpl.id}
                        onChange={() => setTemplateId(tpl.id)}
                      />
                    </div>
                    <h3 className="font-montserrat font-bold text-sm text-ieee-navy">{tpl.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{tpl.description}</p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-ieee-blue font-semibold">
                    <span>A4 Landscape (1123 × 794)</span>
                    {templateId === tpl.id && <span className="font-bold">&bull; Selected</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button onClick={() => setCurrentStep(3)} variant="outline" size="sm" className="text-xs">
                <ArrowLeft size={13} /> Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                {isGenerating ? "Executing Atomic Generation..." : `Generate ${readyCount} Certificates Now`}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: GENERATE & RESULTS */}
        {currentStep === 5 && generationResult && (
          <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-montserrat font-extrabold text-ieee-navy">
                Certificates Successfully Issued!
              </h2>
              <p className="text-xs text-gray-500">
                {generationResult.totalIssued} official certificates have been generated with unique tamper-proof codes and saved to live cloud PostgreSQL.
              </p>
            </div>

            {/* Run Info Card */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 max-w-xl mx-auto text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Run ID:</span>
                <span className="font-mono font-bold text-gray-800">{generationResult.runId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Event:</span>
                <span className="font-semibold text-gray-800">{selectedEvent?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Template Used:</span>
                <span className="font-semibold text-gray-800">{templateId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Issued:</span>
                <span className="font-bold text-emerald-700">{generationResult.totalIssued} records</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={downloadCodesCSV}
                variant="primary"
                size="sm"
                className="text-xs font-bold flex items-center gap-1.5"
              >
                <Download size={14} /> Download Codes CSV
              </Button>

              <Link href="/admin/certificates">
                <Button variant="outline" size="sm" className="text-xs font-bold flex items-center gap-1.5">
                  <FileText size={14} /> View in Certificate Registry
                </Button>
              </Link>

              <Button
                onClick={handleUndoRun}
                disabled={isVoiding}
                variant="outline"
                size="sm"
                className="text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> {isVoiding ? "Voiding..." : "24-Hour Undo Run"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
