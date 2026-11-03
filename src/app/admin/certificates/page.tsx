"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { revokeCertificateAction, replaceCertificateAction } from "@/app/actions/certificates";
import { CertificateRecord, StaffUser, CertificateTemplate } from "@/types";
import { generateCertificateCode } from "@/lib/codeGenerator";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Award,
  Search,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  FilePlus,
  CheckCircle,
  QrCode,
  Copy,
  Check,
  Download,
  X,
  Trash2,
  Edit2,
} from "lucide-react";

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  // Edit Credential Modal State
  const [editingCert, setEditingCert] = useState<CertificateRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editCertType, setEditCertType] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "REVOKED">("ACTIVE");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Revocation Modal State
  const [revokingCert, setRevokingCert] = useState<CertificateRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  // Replacement Modal State
  const [replacingCert, setReplacingCert] = useState<CertificateRecord | null>(null);
  const [correctedName, setCorrectedName] = useState("");
  const [replaceReason, setReplaceReason] = useState("Name spelling correction per verified participant request.");
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Legacy Import State
  const [showLegacyModal, setShowLegacyModal] = useState(false);
  const [legacyName, setLegacyName] = useState("");
  const [legacyEvent, setLegacyEvent] = useState("");
  const [legacyYear, setLegacyYear] = useState("2025");

  // QR Preview & Copy States
  const [previewQrCert, setPreviewQrCert] = useState<{ name: string; roll: string; code: string; qrDataUrl: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleOpenQrPreview = async (cert: CertificateRecord) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";
    const verifyUrl = `${origin}/verify/${cert.code.trim().toUpperCase()}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#002855", light: "#ffffff" },
    });
    setPreviewQrCert({
      name: cert.recipientName,
      roll: cert.recipientRollNumber || "",
      code: cert.code.trim().toUpperCase(),
      qrDataUrl,
    });
  };

  const handleCopyLink = async (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ieeecsiub.vercel.app";
    const verifyUrl = `${origin}/verify/${code.trim().toUpperCase()}`;
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      prompt("Copy official verification URL:", verifyUrl);
    }
  };

  const handleOpenEdit = (cert: CertificateRecord) => {
    setEditingCert(cert);
    setEditName(cert.recipientName || "");
    setEditRoll(cert.recipientRollNumber || "");
    setEditEmail(cert.recipientEmail || "");
    setEditEventTitle(cert.eventTitle || "");
    setEditCertType(cert.certificateType || "Certificate of Participation");
    setEditStatus(cert.status === "REVOKED" ? "REVOKED" : "ACTIVE");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert || !editName.trim()) return;

    setIsSavingEdit(true);
    try {
      await db.updateCertificate(editingCert.code, {
        recipientName: editName.trim(),
        recipientRollNumber: editRoll.trim() || undefined,
        recipientEmail: editEmail.trim() || undefined,
        eventTitle: editEventTitle.trim() || editingCert.eventTitle,
        certificateType: editCertType.trim() || editingCert.certificateType,
        status: editStatus,
      });

      db.addAuditLog(
        currentUser?.name || "Muhammad Roshan Ashraf",
        "CERTIFICATE_UPDATED",
        "certificates",
        editingCert.id,
        `Updated details for ${editingCert.code} (${editName.trim()}).`
      );

      await refreshList();
      setEditingCert(null);
    } catch (err: any) {
      alert("Failed to update credential: " + (err?.message || ""));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCert = async (cert: CertificateRecord) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete and remove certificate ${cert.code} for "${cert.recipientName}"?\n\nThis will remove it from the verification registry and local attendance sheets.`
      )
    ) {
      return;
    }

    try {
      await db.deleteCertificate(cert.code);
      db.addAuditLog(
        currentUser?.name || "Muhammad Roshan Ashraf",
        "CERTIFICATE_DELETED",
        "certificates",
        cert.id,
        `Permanently deleted certificate ${cert.code} for ${cert.recipientName}.`
      );
      await refreshList();
    } catch (err: any) {
      alert("Failed to delete certificate: " + (err?.message || ""));
    }
  };

  useEffect(() => {
    async function load() {
      const live = await db.fetchCertificates();
      setCerts(live);
      const liveTpls = await db.fetchTemplates();
      setTemplates(liveTpls);
    }
    load();
    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const refreshList = async () => {
    const live = await db.fetchCertificates();
    setCerts(live);
  };

  const handleRevokeSubmit = async () => {
    if (!revokingCert || !revokeReason.trim() || !currentUser) return;

    try {
      await revokeCertificateAction(revokingCert.code, revokeReason.trim());
    } catch (err: any) {
      console.warn("Revoke server action warning:", err);
    }

    const today = new Date().toISOString().split("T")[0];
    db.updateCertificate(revokingCert.code, {
      status: "REVOKED",
      revocationDate: today,
      revocationReason: revokeReason.trim(),
    });

    db.addAuditLog(
      currentUser.name,
      "CERTIFICATE_REVOCATION",
      "certificates",
      revokingCert.id,
      `Revoked ${revokingCert.code} (${revokingCert.recipientName}). Reason: ${revokeReason.trim()}`
    );

    setRevokingCert(null);
    setRevokeReason("");
    await refreshList();
    alert(`Certificate ${revokingCert.code} has been marked as REVOKED.`);
  };

  const handleReplaceSubmit = async () => {
    if (!replacingCert || !correctedName.trim() || !currentUser) return;

    let newCode = "";
    try {
      const res = await replaceCertificateAction(
        replacingCert.code,
        correctedName.trim(),
        replaceReason.trim()
      );
      newCode = res.newCode;
    } catch (err: any) {
      console.warn("Replace server action warning:", err);
      newCode = generateCertificateCode("26");
    }

    const today = new Date().toISOString().split("T")[0];

    // 1. Mark old certificate as REPLACED
    db.updateCertificate(replacingCert.code, {
      status: "REPLACED",
      replacedByCode: newCode,
      replacementReason: replaceReason.trim(),
    });

    // 2. Insert new ACTIVE certificate
    const newCert: CertificateRecord = {
      id: `cert-${Date.now()}`,
      code: newCode,
      recipientName: correctedName.trim(),
      publicNameFormat: "FULL_NAME",
      eventId: replacingCert.eventId,
      eventTitle: replacingCert.eventTitle,
      certificateType: replacingCert.certificateType,
      recognitionLevel: replacingCert.recognitionLevel,
      issuerStatement: replacingCert.issuerStatement,
      activityDate: replacingCert.activityDate,
      issueDate: today,
      approverName: currentUser.name,
      approverRole: "Administrator",
      status: "ACTIVE",
      source: replacingCert.source,
      templateId: selectedTemplateId || replacingCert.templateId || db.getActiveTemplate().id,
      teamName: replacingCert.teamName,
      projectTitle: replacingCert.projectTitle,
      createdAt: new Date().toISOString(),
    };
    db.addCertificate(newCert);

    db.addAuditLog(
      currentUser.name,
      "CERTIFICATE_REPLACEMENT",
      "certificates",
      replacingCert.id,
      `Replaced ${replacingCert.code} (${replacingCert.recipientName}) with new code ${newCode} (${correctedName.trim()}).`
    );

    setReplacingCert(null);
    setCorrectedName("");
    await refreshList();
    alert(`Certificate replaced successfully! New code ${newCode} is now ACTIVE.`);
  };

  const handleLegacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legacyName || !legacyEvent || !currentUser) return;

    const legacyCode = `CSIUB-${legacyYear.slice(2)}-LEG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCert: CertificateRecord = {
      id: `cert-leg-${Date.now()}`,
      code: legacyCode,
      recipientName: legacyName.trim(),
      publicNameFormat: "FULL_NAME",
      eventId: "evt-legacy",
      eventTitle: legacyEvent.trim(),
      certificateType: "Certificate of Participation",
      recognitionLevel: "CHAPTER_RECOGNITION",
      issuerStatement: "This is a chapter recognition, not an IEEE credential.",
      activityDate: `${legacyYear}-06-15`,
      issueDate: `${legacyYear}-06-20`,
      approverName: currentUser.name,
      approverRole: "Administrator",
      status: "ACTIVE",
      source: "LEGACY_IMPORT",
      createdAt: new Date().toISOString(),
    };

    db.addCertificate(newCert);
    db.addAuditLog(
      currentUser.name,
      "LEGACY_CERT_IMPORT",
      "certificates",
      newCert.id,
      `Imported legacy certificate ${legacyCode} for ${legacyName}.`
    );

    setShowLegacyModal(false);
    setLegacyName("");
    setLegacyEvent("");
    refreshList();
    alert(`Legacy record ${legacyCode} imported and published.`);
  };

  const filteredCerts = certs.filter(
    (c) =>
      c.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.eventTitle.toLowerCase().includes(search.toLowerCase()) ||
      (c.recipientRollNumber && c.recipientRollNumber.toLowerCase().includes(search.toLowerCase())) ||
      (c.recipientEmail && c.recipientEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
              Verified Credentials & QR Registry
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Search, verify, revoke credentials, or view live issued QR records synchronized with Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/admin/attendance">
              <Button variant="accent" size="sm" className="text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Award size={15} /> Attendance & QR Generator Hub
              </Button>
            </Link>

            <Button onClick={() => setShowLegacyModal(true)} variant="outline" size="sm" className="text-xs">
              <FilePlus size={14} className="mr-1.5" /> Import Legacy
            </Button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by recipient name, code, or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-ieee-blue"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>
              Total Records: <strong>{certs.length}</strong>
            </span>
            <span>•</span>
            <span className="text-[#00843D] font-semibold">
              Active: {certs.filter((c) => c.status === "ACTIVE").length}
            </span>
            <span>•</span>
            <span className="text-[#E87722] font-semibold">
              Replaced: {certs.filter((c) => c.status === "REPLACED").length}
            </span>
            <span>•</span>
            <span className="text-[#BA0C2F] font-semibold">
              Revoked: {certs.filter((c) => c.status === "REVOKED").length}
            </span>
          </div>
        </div>

        {/* Table of Certificates */}
        <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-montserrat uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Certificate Code</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Event & Type</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-ieee-blue">
                      <Link
                        href={`/verify/${cert.code}`}
                        target="_blank"
                        className="hover:underline flex items-center gap-1"
                      >
                        {cert.code} <ExternalLink size={11} className="text-gray-400" />
                      </Link>
                    </td>

                    <td className="p-4 font-semibold text-gray-900">
                      <div>{cert.recipientName}</div>
                      {(cert.recipientRollNumber || cert.recipientEmail) && (
                        <div className="text-[11px] font-normal text-gray-500 space-x-1.5 mt-0.5">
                          {cert.recipientRollNumber && <span className="font-mono text-ieee-navy font-semibold">{cert.recipientRollNumber}</span>}
                          {cert.recipientRollNumber && cert.recipientEmail && <span>•</span>}
                          {cert.recipientEmail && <span>{cert.recipientEmail}</span>}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-gray-600">
                      <span className="font-medium text-gray-800 block truncate max-w-xs">
                        {cert.eventTitle}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {cert.certificateType}
                      </span>
                    </td>

                    <td className="p-4 text-gray-600 whitespace-nowrap">
                      {cert.issueDate}
                    </td>

                    <td className="p-4">
                      <Badge status={cert.status} size="sm" />
                      {cert.replacedByCode && (
                        <span className="block text-[10px] text-ieee-orange font-mono mt-0.5">
                          → {cert.replacedByCode}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Live Verify Link */}
                      <a
                        href={`/verify/${cert.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-ieee-navy hover:text-white bg-ieee-surfaceTint hover:bg-ieee-blue px-2.5 py-1 rounded transition-colors"
                        title="Open live verification page"
                      >
                        <ExternalLink size={11} /> Verify
                      </a>

                      {/* View / Download QR */}
                      <button
                        onClick={() => handleOpenQrPreview(cert)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-ieee-navy bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                        title="View & Download QR Code Card"
                      >
                        <QrCode size={11} /> QR Code
                      </button>

                      {/* Copy Link */}
                      <button
                        onClick={() => handleCopyLink(cert.code)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-ieee-navy bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                        title="Copy direct verification link"
                      >
                        {copiedCode === cert.code ? (
                          <>
                            <Check size={11} className="text-green-600" />
                            <span className="text-green-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Edit Attendee / Credential Button */}
                      <button
                        onClick={() => handleOpenEdit(cert)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-ieee-navy bg-gray-100 hover:bg-ieee-surfaceTint px-2 py-1 rounded transition-colors"
                        title="Edit recipient name, roll number, or details"
                      >
                        <Edit2 size={11} className="text-ieee-blue" /> Edit
                      </button>

                      {cert.status === "ACTIVE" && (
                        <>
                          <button
                            onClick={() => {
                              setReplacingCert(cert);
                              setCorrectedName(cert.recipientName);
                              setSelectedTemplateId(cert.templateId || db.getActiveTemplate().id);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ieee-blue hover:underline bg-ieee-surfaceTint/50 px-2 py-1 rounded"
                            title="Re-issue with a new code and replace old"
                          >
                            <RefreshCw size={11} /> Replace
                          </button>

                          <button
                            onClick={() => setRevokingCert(cert)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#BA0C2F] hover:underline bg-[#FCE8E6] px-2 py-1 rounded"
                            title="Mark certificate as revoked"
                          >
                            <AlertTriangle size={11} /> Revoke
                          </button>
                        </>
                      )}

                      {cert.status !== "ACTIVE" && (
                        <span className="text-[11px] text-gray-400 italic">
                          Locked ({cert.status.toLowerCase()})
                        </span>
                      )}

                      {/* Delete / Remove Single Row Button */}
                      <button
                        onClick={() => handleDeleteCert(cert)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                        title="Permanently remove and delete from database"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCerts.length === 0 && (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-ieee-surfaceTint flex items-center justify-center mx-auto text-ieee-navy">
                  <Award size={24} />
                </div>
                <h3 className="font-montserrat font-bold text-sm text-gray-800">
                  {search ? "No matching records found" : "No Credentials Issued Yet"}
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  {search
                    ? `No verified credentials matched "${search}". Try searching by another name, roll number, or code.`
                    : "Verification codes and tamper-evident QR codes are generated directly from the Attendance Hub."}
                </p>
                {!search && (
                  <div className="pt-2">
                    <Link href="/admin/attendance">
                      <Button variant="accent" size="sm" className="text-xs font-bold shadow-sm">
                        Go to Attendance & QR Generator Hub →
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* QR Code Preview Modal */}
        {previewQrCert && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-center space-y-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="font-montserrat font-bold text-base text-ieee-navy">{previewQrCert.name}</h3>
                  {previewQrCert.roll && (
                    <span className="text-xs font-mono text-gray-500 block">{previewQrCert.roll}</span>
                  )}
                </div>
                <button onClick={() => setPreviewQrCert(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>

              {/* QR Image Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewQrCert.qrDataUrl} alt="QR Code" className="w-48 h-48 rounded shadow-xs" />
                <span className="mt-3 font-mono font-bold text-xs text-ieee-blue tracking-wider bg-white px-3 py-1 rounded-full border">
                  {previewQrCert.code}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={previewQrCert.qrDataUrl}
                  download={`IEEE-QR-${previewQrCert.code}.png`}
                  className="flex-1 py-2 bg-ieee-navy hover:bg-ieee-blue text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download size={14} /> Download QR PNG
                </a>
                <button
                  onClick={() => handleCopyLink(previewQrCert.code)}
                  className="px-3 py-2 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Credential (Name, Roll, Email, Details) */}
        {editingCert && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
                    <Edit2 size={16} className="text-ieee-blue" /> Edit Credential Details
                  </h3>
                  <span className="font-mono text-xs text-ieee-blue font-bold">{editingCert.code}</span>
                </div>
                <button onClick={() => !isSavingEdit && setEditingCert(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Recipient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Muhammad Roshan Ashraf"
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-medium"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">This name appears on the public verification page and QR records.</p>
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
                    <label className="font-semibold text-gray-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. student@iub.edu.pk"
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Event Title</label>
                  <input
                    type="text"
                    value={editEventTitle}
                    onChange={(e) => setEditEventTitle(e.target.value)}
                    placeholder="e.g. Hands-on Cyber Defense Workshop"
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Credential Type</label>
                  <input
                    type="text"
                    value={editCertType}
                    onChange={(e) => setEditCertType(e.target.value)}
                    placeholder="e.g. Certificate of Participation"
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Credential Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE (Valid & Verified)</option>
                    <option value="REVOKED">REVOKED (Invalidated)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={() => setEditingCert(null)}
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
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Revoke Certificate */}
        {revokingCert && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-montserrat font-bold text-base text-[#BA0C2F] flex items-center gap-1.5">
                  <AlertTriangle size={18} /> Revoke Certificate
                </h3>
                <button onClick={() => setRevokingCert(null)}>
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Revoking certificate <strong>{revokingCert.code}</strong> (issued to{" "}
                <strong>{revokingCert.recipientName}</strong>). The certificate will
                permanently show as <strong>REVOKED</strong> on the public Verify page.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Documented Reason for Revocation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Issued in error; attendance criteria unmet."
                  className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setRevokingCert(null)} variant="secondary" size="sm">
                  Cancel
                </Button>
                <Button onClick={handleRevokeSubmit} variant="danger" size="sm">
                  Confirm Permanent Revocation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Replace Certificate (Spelling / Name Correction) */}
        {replacingCert && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-card max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-montserrat font-bold text-base text-[#E87722] flex items-center gap-1.5">
                  <RefreshCw size={18} /> Replace Certificate (Correction)
                </h3>
                <button onClick={() => setReplacingCert(null)}>
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Issuing a replacement for <strong>{replacingCert.code}</strong>. The original
                record will show as <strong>REPLACED</strong> and link to the new code.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Corrected Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={correctedName}
                    onChange={(e) => setCorrectedName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Certificate Design Template *
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white text-xs font-semibold"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.isDefault ? "★ (Active Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Correction Justification *
                  </label>
                  <input
                    type="text"
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setReplacingCert(null)} variant="secondary" size="sm">
                  Cancel
                </Button>
                <Button
                  onClick={handleReplaceSubmit}
                  variant="primary"
                  size="sm"
                  className="bg-[#E87722] hover:bg-[#c96316]"
                >
                  Issue Corrected Replacement
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Legacy Import */}
        {showLegacyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleLegacySubmit} className="bg-white rounded-card max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-1.5">
                  <FilePlus size={18} /> Import Legacy Certificate
                </h3>
                <button type="button" onClick={() => setShowLegacyModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Participant Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={legacyName}
                    onChange={(e) => setLegacyName(e.target.value)}
                    placeholder="e.g. Usman Ali"
                    className="w-full p-2.5 border rounded-lg outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Past Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={legacyEvent}
                    onChange={(e) => setLegacyEvent(e.target.value)}
                    placeholder="e.g. Annual IEEE CS TechFest 2025"
                    className="w-full p-2.5 border rounded-lg outline-none focus:ring-1 focus:ring-ieee-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Year of Issuance
                  </label>
                  <select
                    value={legacyYear}
                    onChange={(e) => setLegacyYear(e.target.value)}
                    className="w-full p-2.5 border rounded-lg outline-none bg-white"
                  >
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowLegacyModal(false)} variant="secondary" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Authorize Legacy Record
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
