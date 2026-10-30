"use client";

import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { EventItem, UploadBatch, StaffUser, CertificateRecord } from "@/types";
import { generateCertificateCode, generateQrPngDataUrl } from "@/lib/codeGenerator";
import { Button } from "@/components/ui/Button";
import { CHAPTER_INFO } from "@/lib/constants";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  QrCode,
  FileCheck2,
  Trash2,
  Sparkles,
  FileText,
  Send,
} from "lucide-react";

export default function Option1RegistryPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [batches, setBatches] = useState<UploadBatch[]>([]);

  // Generator State
  const [selectedEventId, setSelectedEventId] = useState("");
  const [certType, setCertType] = useState("Certificate of Participation");
  const [rawNames, setRawNames] = useState("");
  const [generatedList, setGeneratedList] = useState<
    { name: string; code: string; qrDataUrl: string }[]
  >([]);
  const [generating, setGenerating] = useState(false);
  const [zipping, setZipping] = useState(false);

  // Staged Upload State
  const [stagedMessage, setStagedMessage] = useState("");
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const allEvents = await db.fetchEvents();
      setEvents(allEvents);
      setBatches(db.getBatches());
    }
    load();
    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleGenerateCodes = async () => {
    const names = rawNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      alert("Please enter or upload at least one participant name.");
      return;
    }

    setGenerating(true);
    const results = [];
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";

    for (const name of names) {
      const code = generateCertificateCode("26");
      const verifyUrl = `${origin}/verify/${code}`;
      const qrDataUrl = await generateQrPngDataUrl(verifyUrl);
      results.push({ name, code, qrDataUrl });
    }

    setGeneratedList(results);
    setGenerating(false);
  };

  // Upload CSV or Excel file of participant names
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonRows.length === 0) {
        alert("The uploaded file is empty.");
        return;
      }

      const extractedNames: string[] = [];
      jsonRows.forEach((row, idx) => {
        const name = row["Name"] || row["name"] || row["Full Name"] || row["Participant Name"] || Object.values(row)[0];
        if (name && String(name).trim()) {
          extractedNames.push(String(name).trim());
        }
      });

      if (extractedNames.length === 0) {
        alert("Could not detect any names in the uploaded sheet. Please ensure a 'Name' column exists.");
        return;
      }

      setRawNames(extractedNames.join("\n"));
      alert(`Loaded ${extractedNames.length} names from ${file.name}. Click 'Generate Codes & QR Pack' to process!`);
    } catch (err) {
      console.error(err);
      alert("Failed to parse file. Please upload a valid CSV or Excel spreadsheet.");
    } finally {
      if (csvFileInputRef.current) csvFileInputRef.current.value = "";
    }
  };

  // Download QR Codes ZIP Package
  const handleDownloadQrZip = async () => {
    if (generatedList.length === 0) return;
    setZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("IEEE_CS_UCET_IUB_QR_Codes");

      generatedList.forEach((item) => {
        const base64Data = item.qrDataUrl.replace(/^data:image\/png;base64,/, "");
        folder?.file(`${item.code}_${item.name.replace(/\s+/g, "_")}.png`, base64Data, {
          base64: true,
        });
      });

      // Include CSV in ZIP
      let csvContent = "Recipient Name,Certificate Type,Certificate Code,Verification URL\n";
      const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";
      generatedList.forEach((item) => {
        csvContent += `"${item.name}","${certType}","${item.code}","${origin}/verify/${item.code}"\n`;
      });
      zip.file("Certificate_Codes_List.csv", csvContent);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate_QR_Pack_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setZipping(false);
    }
  };

  // Export Spreadsheet (.xlsx)
  const handleExportCodesExcel = () => {
    if (generatedList.length === 0) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";
    const data = generatedList.map((item) => ({
      "Recipient Name": item.name,
      "Certificate Type": certType,
      "Certificate Code": item.code,
      "Verification URL": `${origin}/verify/${item.code}`,
      "Status": "ACTIVE",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Certificate Codes");
    XLSX.writeFile(workbook, `Certificate_Codes_${Date.now()}.xlsx`);
  };

  // Single-Click Direct Publish to Active Registry
  const handleDirectPublishActive = () => {
    if (generatedList.length === 0 || !selectedEventId) {
      alert("Please select an event and generate codes first.");
      return;
    }

    const event = events.find((e) => e.id === selectedEventId);
    const today = new Date().toISOString().split("T")[0];

    generatedList.forEach((item) => {
      const newCert: CertificateRecord = {
        id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: item.code,
        recipientName: item.name,
        publicNameFormat: "FULL_NAME",
        eventId: selectedEventId,
        eventTitle: event?.title || "Chapter Technical Event",
        certificateType: certType,
        recognitionLevel: "CHAPTER_RECOGNITION",
        issuerStatement: CHAPTER_INFO.issuerStatementDefault,
        activityDate: event?.startDate.split("T")[0] || today,
        issueDate: today,
        approverName: currentUser?.name || "Muhammad Roshan Ashraf",
        approverRole: "Administrator",
        status: "ACTIVE",
        source: "UPLOAD_REGISTRY",
        createdAt: new Date().toISOString(),
      };
      db.addCertificate(newCert);
    });

    db.addAuditLog(
      currentUser?.name || "Muhammad Roshan Ashraf",
      "DIRECT_REGISTRY_PUBLISH",
      "certificates",
      selectedEventId,
      `Directly published ${generatedList.length} active certificates for event "${event?.title}".`
    );

    alert(`Success! All ${generatedList.length} certificates are now ACTIVE and immediately verifiable on /verify!`);
    setGeneratedList([]);
  };

  // Stage batch
  const handleStageGeneratedBatch = () => {
    if (generatedList.length === 0 || !selectedEventId) {
      alert("Please generate codes and pick an event first.");
      return;
    }

    const event = events.find((e) => e.id === selectedEventId);
    const uploader = currentUser?.name || "Administrator";

    const newBatch: UploadBatch = {
      id: `batch-${Date.now()}`,
      filename: `batch_${Date.now()}.csv`,
      eventId: selectedEventId,
      eventTitle: event?.title || "Chapter Technical Event",
      rowCount: generatedList.length,
      uploadedBy: uploader,
      uploadedAt: new Date().toISOString(),
      status: "STAGED",
      stagedRows: generatedList.map((item) => ({
        recipientName: item.name,
        certificateType: certType,
        code: item.code,
      })),
    };

    db.addBatch(newBatch);
    setBatches(db.getBatches());

    db.addAuditLog(
      uploader,
      "UPLOAD_BATCH_STAGED",
      "upload_batches",
      newBatch.id,
      `Uploaded batch ${newBatch.filename} (${newBatch.rowCount} records) into staging queue.`
    );

    setStagedMessage(`Batch staged successfully! Total ${newBatch.rowCount} records queued.`);
    setGeneratedList([]);
  };

  const handleApproveBatch = (batchId: string) => {
    if (!currentUser) return;
    const success = db.approveBatch(batchId, currentUser.name);
    if (success) {
      setBatches(db.getBatches());
      alert("Batch successfully approved! All certificates are now live on /verify.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10 font-openSans">
        {/* Header */}
        <div>
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
            Offline Canva / Word / Photoshop Workflow
          </span>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
            Code & QR Pack Generator, CSV Upload & Registry Approval
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Upload participant spreadsheets, generate tamper-proof checksum codes with QR image packages for your graphic designers, and publish records directly to the public verification registry.
          </p>
        </div>

        {/* Workstation 1: Code & QR Pack Generator */}
        <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <h2 className="font-montserrat font-bold text-lg text-ieee-navy flex items-center gap-2">
              <QrCode className="text-ieee-blue" size={20} />
              1. Code & QR Pack Generator
            </h2>
            <span className="text-xs text-ieee-muted font-mono">Format: CSIUB-26-XXXX-XXXX</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Select Associated Event *
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Event --</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Certificate Recognition Type *
                </label>
                <input
                  type="text"
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  placeholder="e.g. Certificate of Participation"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                />
              </div>

              {/* Upload or Paste Names */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-700">
                    Participant Names (one per line) *
                  </label>
                  <div>
                    <input
                      type="file"
                      ref={csvFileInputRef}
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => csvFileInputRef.current?.click()}
                      className="text-ieee-blue hover:underline font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Upload size={12} /> Upload CSV/Excel
                    </button>
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={rawNames}
                  onChange={(e) => setRawNames(e.target.value)}
                  placeholder="Paste student names or click Upload CSV/Excel above"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none font-mono text-xs"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleGenerateCodes}
                  disabled={generating}
                  variant="primary"
                  size="md"
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  {generating ? "Computing QR Codes..." : "Generate Codes & QR Pack"}
                </Button>
              </div>
            </div>

            {/* Generated Results Preview */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                  <span className="font-bold text-gray-800">
                    Generated Output ({generatedList.length} Recipients)
                  </span>
                  {generatedList.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExportCodesExcel}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-ieee-blue"
                      >
                        <FileSpreadsheet size={13} />
                        Excel
                      </button>
                      <button
                        onClick={handleDownloadQrZip}
                        disabled={zipping}
                        className="inline-flex items-center gap-1 text-xs font-bold text-ieee-blue hover:underline"
                      >
                        <Download size={13} />
                        {zipping ? "Zipping..." : "QR ZIP Pack"}
                      </button>
                    </div>
                  )}
                </div>

                {generatedList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    Paste participant names on the left or upload a spreadsheet, then click
                    Generate to compute tamper-proof codes and QR PNGs.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {generatedList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.qrDataUrl}
                            alt="QR"
                            className="w-10 h-10 border border-gray-200 rounded p-0.5 bg-white"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">{item.name}</span>
                            <span className="font-mono text-[11px] text-ieee-blue font-bold">
                              {item.code}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-status-active font-semibold">Valid</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {generatedList.length > 0 && (
                <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
                  <Button
                    onClick={handleDirectPublishActive}
                    variant="accent"
                    size="sm"
                    className="w-full flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle size={14} />
                    Approve & Publish Directly to Live Registry (1-Click)
                  </Button>
                  <button
                    onClick={handleStageGeneratedBatch}
                    className="w-full py-1.5 text-center text-gray-500 hover:text-gray-800 text-[11px] font-semibold"
                  >
                    Or Save to Staging Queue for Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workstation 2: Staged Batches Review & Approval */}
        <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-montserrat font-bold text-lg text-ieee-navy flex items-center gap-2">
                <FileCheck2 className="text-[#00843D]" size={20} />
                2. Staged Batches & Admin Publishing Queue
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Review staged batches and authorize records to publish directly to the public registry.
              </p>
            </div>

            <div className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              Logged in as: <strong className="text-ieee-navy">{currentUser?.name}</strong>{" "}
              <span className="text-ieee-orange font-bold">({currentUser?.role})</span>
            </div>
          </div>

          {stagedMessage && (
            <div className="p-3 bg-[#E6F4EA] border border-[#A8DAB5] rounded-lg text-xs text-[#00843D] flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{stagedMessage}</span>
            </div>
          )}

          {batches.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No batches have been uploaded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => {
                const isStaged = batch.status === "STAGED";
                const isApproved = batch.status === "APPROVED";

                return (
                  <div
                    key={batch.id}
                    className={`border rounded-xl p-5 space-y-3 transition-all ${
                      isStaged
                        ? "bg-[#FEF3D6]/40 border-[#FAD79A]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-montserrat font-bold text-sm text-ieee-navy">
                            {batch.filename}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isStaged
                                ? "bg-[#FEF3D6] text-[#B45309]"
                                : "bg-[#E6F4EA] text-[#00843D]"
                            }`}
                          >
                            {batch.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px] mt-0.5">
                          Event: <strong>{batch.eventTitle}</strong> • {batch.rowCount} Rows
                        </p>
                      </div>

                      <div className="text-[11px] text-gray-500">
                        Uploaded by: <strong>{batch.uploadedBy}</strong>
                        {batch.approvedBy && (
                          <span className="block text-status-active">
                            Approved by: {batch.approvedBy}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preview Staged Rows */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs max-h-36 overflow-y-auto space-y-1 font-mono">
                      {batch.stagedRows.map((r, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-gray-700">
                          <span>{r.recipientName}</span>
                          <span className="text-ieee-blue font-bold">{r.code}</span>
                        </div>
                      ))}
                    </div>

                    {/* Approval Action */}
                    {isStaged && (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-[11px] text-[#B45309] flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          <span>
                            Ready for Administrator authorization. Click Approve to publish live.
                          </span>
                        </div>

                        <Button
                          onClick={() => handleApproveBatch(batch.id)}
                          variant="primary"
                          size="sm"
                          className="bg-[#00843D] hover:bg-[#006e33]"
                        >
                          <CheckCircle size={14} className="mr-1.5" />
                          Approve Batch & Publish to Verify Registry
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
