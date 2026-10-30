"use client";

import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { EventItem, UploadBatch, StaffUser } from "@/types";
import { generateCertificateCode, generateQrPngDataUrl } from "@/lib/codeGenerator";
import { Button } from "@/components/ui/Button";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  QrCode,
  ShieldAlert,
  FileCheck2,
  Trash2,
} from "lucide-react";

export default function Option1RegistryPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [batches, setBatches] = useState<UploadBatch[]>([]);

  // Generator State
  const [selectedEventId, setSelectedEventId] = useState("");
  const [certType, setCertType] = useState("Certificate of Participation");
  const [rawNames, setRawNames] = useState(
    "Muhammad Bilal\nFatima Tariq\nZubair Ahmed\nSara Khan"
  );
  const [generatedList, setGeneratedList] = useState<
    { name: string; code: string; qrDataUrl: string }[]
  >([]);
  const [generating, setGenerating] = useState(false);
  const [zipping, setZipping] = useState(false);

  // Staged Upload State
  const [csvFileName, setCsvFileName] = useState("");
  const [stagedMessage, setStagedMessage] = useState("");

  useEffect(() => {
    setEvents(db.getEvents());
    setBatches(db.getBatches());
    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Update current user if role selector changes
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("ieee_cs_active_staff");
      if (saved) setCurrentUser(JSON.parse(saved));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleGenerateCodes = async () => {
    const names = rawNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      alert("Please enter at least one participant name.");
      return;
    }

    setGenerating(true);
    const results = [];
    const origin = typeof window !== "undefined" ? window.location.origin : "https://cs.ucet-iub.ieee.org";

    for (const name of names) {
      const code = generateCertificateCode("26");
      const verifyUrl = `${origin}/verify/${code}`;
      const qrDataUrl = await generateQrPngDataUrl(verifyUrl);
      results.push({ name, code, qrDataUrl });
    }

    setGeneratedList(results);
    setGenerating(false);
  };

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

      // Also include CSV in the zip
      let csvContent = "Recipient Name,Certificate Type,Certificate Code,Verification URL\n";
      generatedList.forEach((item) => {
        csvContent += `"${item.name}","${certType}","${item.code}","${typeof window !== "undefined" ? window.location.origin : ""}/verify/${item.code}"\n`;
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

  const handleStageGeneratedBatch = () => {
    if (generatedList.length === 0 || !selectedEventId) {
      alert("Please generate codes and pick an event first.");
      return;
    }

    const event = events.find((e) => e.id === selectedEventId);
    const uploader = currentUser?.name || "Staff Officer";

    const newBatch: UploadBatch = {
      id: `batch-${Date.now()}`,
      filename: `generated_batch_${Date.now()}.csv`,
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
      "STAGED_BATCH_UPLOAD",
      "upload_batches",
      newBatch.id,
      `Uploaded and staged batch with ${newBatch.rowCount} recipients for "${newBatch.eventTitle}".`
    );

    setStagedMessage(`Batch staged successfully! Total ${newBatch.rowCount} records waiting for 2nd officer approval.`);
    setGeneratedList([]);
  };

  const handleApproveBatch = (batchId: string) => {
    if (!currentUser) return;

    const success = db.approveBatch(batchId, currentUser.name);
    if (success) {
      setBatches(db.getBatches());
      alert("Batch successfully approved and published! All records are now active on /verify.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
            Option 1: Certificate Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
            Code & QR Pack Generator, CSV Upload & Approval
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            In Option 1, chapter designers produce the physical or digital certificates
            offline. The site generates random tamper-resistant codes and QR images, holds
            uploaded participant rosters in a staged queue, and requires a second-officer
            approval before publishing to the public Verify page.
          </p>
        </div>

        {/* Workstation 1: Generate Codes & QR Pack */}
        <div className="bg-white border border-gray-200 rounded-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <h2 className="font-montserrat font-bold text-lg text-ieee-navy flex items-center gap-2">
              <QrCode className="text-ieee-blue" size={20} />
              1. Generate Codes & QR Image Pack
            </h2>
            <span className="text-xs text-ieee-muted">Format: CSIUB-26-XXXX-XXXX</span>
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white"
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

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Participant Names (one per line) *
                </label>
                <textarea
                  rows={6}
                  value={rawNames}
                  onChange={(e) => setRawNames(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none font-mono text-xs"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleGenerateCodes}
                  disabled={generating}
                  variant="primary"
                  size="md"
                  className="w-full"
                >
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
                    <button
                      onClick={handleDownloadQrZip}
                      disabled={zipping}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-ieee-blue hover:underline"
                    >
                      <Download size={13} />
                      {zipping ? "Zipping..." : "Download ZIP Package"}
                    </button>
                  )}
                </div>

                {generatedList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    Paste participant names on the left and click Generate to produce unique
                    checksum codes and QR PNGs.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {generatedList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.qrDataUrl}
                            alt="QR"
                            className="w-10 h-10 border border-gray-200 rounded"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">{item.name}</span>
                            <span className="font-mono text-[11px] text-ieee-blue font-semibold">
                              {item.code}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400">Check: Valid</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {generatedList.length > 0 && (
                <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
                  <Button
                    onClick={handleStageGeneratedBatch}
                    variant="accent"
                    size="sm"
                    className="w-full"
                  >
                    Submit this Roster to Staging Queue (2nd Officer Review)
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workstation 2: Staged Batches Review & Approval (Enforces Dual Officer Policy) */}
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
                            Second-officer sign-off needed. Site Admin cannot approve.
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
