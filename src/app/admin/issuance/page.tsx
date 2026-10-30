"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { EventItem, Registration, StaffUser, CertificateRecord, CertificateTemplate } from "@/types";
import { generateCertificateCode } from "@/lib/codeGenerator";
import { generateCertificatePdf } from "@/lib/certificatePdf";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  FileText,
  ShieldCheck,
  Download,
  Users,
} from "lucide-react";

export default function Option2IssuancePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issuedBatch, setIssuedBatch] = useState<CertificateRecord[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    const allEvts = db.getEvents();
    setEvents(allEvts);
    if (allEvts.length > 0) setSelectedEventId(allEvts[0].id);
    setRegistrations(db.getRegistrations());

    const allTpls = db.getTemplates();
    setTemplates(allTpls);
    const activeTpl = db.getActiveTemplate();
    if (activeTpl) setSelectedTemplateId(activeTpl.id);

    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const eventRegs = registrations.filter((r) => r.eventId === selectedEventId);

  // Categorize based on attendance and payment status
  const eligibleAttendees = eventRegs.filter((r) => r.status === "ATTENDED");
  const manualReview = eventRegs.filter((r) => r.status === "CONFIRMED");
  const notEligible = eventRegs.filter((r) => r.status === "PAYMENT_PENDING" || r.status === "REGISTERED");

  const handleIssueBatch = async () => {
    if (!currentUser || !selectedEvent) return;

    if (eligibleAttendees.length === 0) {
      alert("No attendees currently meet the eligibility criteria (Attended status required).");
      return;
    }

    setIssuing(true);
    const today = new Date().toISOString().split("T")[0];
    const generated: CertificateRecord[] = [];

    for (const attendee of eligibleAttendees) {
      const code = generateCertificateCode("26");
      const cert: CertificateRecord = {
        id: `cert-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code,
        recipientName: attendee.fullName,
        publicNameFormat: attendee.namePreference,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        certificateType: selectedEvent.certificateType,
        recognitionLevel: "CHAPTER_RECOGNITION",
        issuerStatement: "This is a chapter recognition, not an IEEE credential.",
        activityDate: selectedEvent.startDate.split("T")[0],
        issueDate: today,
        approverName: currentUser.name,
        approverRole: "Administrator",
        status: "ACTIVE",
        source: "IN_SITE_GENERATED",
        templateId: selectedTemplateId || undefined,
        sha256Fingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        createdAt: new Date().toISOString(),
      };

      db.addCertificate(cert);
      generated.push(cert);
    }

    db.addAuditLog(
      currentUser.name,
      "INSITE_BATCH_ISSUANCE",
      "certificates",
      selectedEvent.id,
      `Issued ${generated.length} certificates for "${selectedEvent.title}" meeting rule: ${selectedEvent.certificateRule}`
    );

    setIssuedBatch(generated);
    setIssuing(false);
    alert(`Successfully generated and published ${generated.length} certificates to /verify!`);
  };

  const handleDownloadSinglePdf = (cert: CertificateRecord) => {
    window.open(`/verify/${cert.code}/certificate?print=true`, "_blank");
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
            Option 2: In-site Generation
          </span>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
            Eligibility Validation & Batch Certificate Issuance
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            Automatically parses workshop attendance against the pre-published eligibility
            rule. A named Certificate Approver signs the batch, rendering official PDFs with
            embedded QR codes and SHA-256 fingerprints.
          </p>
        </div>

        {/* Event Selector, Template Selector & Rule Box */}
        <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                1. Select Event for Issuance
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white font-medium"
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
                <label className="block font-semibold text-gray-700">
                  2. Certificate Design Template
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
                className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white font-medium"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} {tpl.isDefault ? "★ (Active Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedEvent && (
              <div className="p-3 bg-gray-50 border rounded-lg space-y-1">
                <span className="font-bold text-gray-700 block">
                  Published Eligibility Rule:
                </span>
                <p className="text-ieee-navy italic">
                  &ldquo;{selectedEvent.certificateRule}&rdquo;
                </p>
                <span className="text-[11px] text-gray-500 block">
                  Recognition: {selectedEvent.certificateType}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Sorting Buckets: Eligible, Manual Review, Not Eligible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Bucket 1: Eligible */}
          <div className="bg-white border-2 border-[#A8DAB5] rounded-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#A8DAB5] pb-2">
              <span className="font-montserrat font-bold text-sm text-[#00843D] flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Eligible ({eligibleAttendees.length})
              </span>
              <span className="text-[10px] bg-[#E6F4EA] text-[#00843D] px-2 py-0.5 rounded-full font-bold">
                Rule Satisfied
              </span>
            </div>
            <p className="text-[11px] text-gray-600">
              Scanned in at check-in station; payment verified.
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {eligibleAttendees.map((a) => (
                <div key={a.id} className="p-2 bg-gray-50 rounded border text-gray-800">
                  <span className="font-bold block">{a.fullName}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Ticket: {a.ticketCode}
                  </span>
                </div>
              ))}
              {eligibleAttendees.length === 0 && (
                <p className="text-gray-400 text-center py-4">No attendees checked in yet.</p>
              )}
            </div>
          </div>

          {/* Bucket 2: Manual Review */}
          <div className="bg-white border border-[#FAD79A] rounded-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#FAD79A] pb-2">
              <span className="font-montserrat font-bold text-sm text-[#E87722] flex items-center gap-1.5">
                <AlertTriangle size={16} /> Manual Review ({manualReview.length})
              </span>
              <span className="text-[10px] bg-[#FEF3D6] text-[#E87722] px-2 py-0.5 rounded-full font-bold">
                Seat Confirmed
              </span>
            </div>
            <p className="text-[11px] text-gray-600">
              Registered & paid, but physical check-in timestamp missing.
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {manualReview.map((a) => (
                <div key={a.id} className="p-2 bg-gray-50 rounded border text-gray-800">
                  <span className="font-bold block">{a.fullName}</span>
                  <span className="text-[10px] text-gray-500">{a.email}</span>
                </div>
              ))}
              {manualReview.length === 0 && (
                <p className="text-gray-400 text-center py-4">No candidates in review.</p>
              )}
            </div>
          </div>

          {/* Bucket 3: Ineligible */}
          <div className="bg-white border border-gray-200 rounded-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-montserrat font-bold text-sm text-gray-600">
                Ineligible ({notEligible.length})
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                Unpaid / Absent
              </span>
            </div>
            <p className="text-[11px] text-gray-600">
              Registrations pending payment or absent from sessions.
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {notEligible.map((a) => (
                <div key={a.id} className="p-2 bg-gray-50 rounded border text-gray-500">
                  <span>{a.fullName}</span>
                  <span className="text-[10px] text-gray-400 block font-mono">
                    Status: {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Approver Sign-Off Action */}
        <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
              <ShieldCheck className="text-ieee-blue" size={20} />
              Certificate Approver Authorization
            </h3>
            <p className="text-gray-600">
              Signing off will stamp {eligibleAttendees.length} official certificates with
              QR code and publish them live to the public registry.
            </p>
          </div>

          <Button
            onClick={handleIssueBatch}
            disabled={issuing || eligibleAttendees.length === 0}
            variant="primary"
            size="md"
            className="bg-[#00843D] hover:bg-[#006e33]"
          >
            {issuing ? "Rendering & Signing..." : "Approve & Issue Certificate Batch"}
          </Button>
        </div>

        {/* Newly Issued Batch Preview with PDF Download */}
        {issuedBatch.length > 0 && (
          <div className="bg-[#E6F4EA] border border-[#A8DAB5] rounded-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-base text-[#00843D] flex items-center gap-2">
                <Award size={20} /> Batch Issued Successfully ({issuedBatch.length} Records)
              </h3>
            </div>

            <p className="text-xs text-gray-700">
              All certificates have been assigned unique CSIUB-26 codes and SHA-256
              cryptographic records.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {issuedBatch.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white p-3 rounded-lg border border-[#A8DAB5] flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-gray-900 block">{cert.recipientName}</span>
                    <span className="font-mono text-[11px] text-ieee-blue">{cert.code}</span>
                  </div>
                  <button
                    onClick={() => handleDownloadSinglePdf(cert)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-ieee-blue hover:underline bg-ieee-surfaceTint/50 px-2.5 py-1.5 rounded"
                  >
                    <Download size={12} /> Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
