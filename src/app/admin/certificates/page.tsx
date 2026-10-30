"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { CertificateRecord, StaffUser } from "@/types";
import { generateCertificateCode } from "@/lib/codeGenerator";
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
  X,
} from "lucide-react";

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  // Revocation Modal State
  const [revokingCert, setRevokingCert] = useState<CertificateRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  // Replacement Modal State
  const [replacingCert, setReplacingCert] = useState<CertificateRecord | null>(null);
  const [correctedName, setCorrectedName] = useState("");
  const [replaceReason, setReplaceReason] = useState("Name spelling correction per verified participant request.");

  // Legacy Import State
  const [showLegacyModal, setShowLegacyModal] = useState(false);
  const [legacyName, setLegacyName] = useState("");
  const [legacyEvent, setLegacyEvent] = useState("");
  const [legacyYear, setLegacyYear] = useState("2025");

  useEffect(() => {
    async function load() {
      const live = await db.fetchCertificates();
      setCerts(live);
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

  const handleRevokeSubmit = () => {
    if (!revokingCert || !revokeReason.trim() || !currentUser) return;

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
    refreshList();
    alert(`Certificate ${revokingCert.code} has been marked as REVOKED.`);
  };

  const handleReplaceSubmit = () => {
    if (!replacingCert || !correctedName.trim() || !currentUser) return;

    const newCode = generateCertificateCode("26");
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
    refreshList();
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
      c.eventTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
              Certificate Lifecycle Records
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Search, verify, revoke erroneously issued credentials, or issue replacements
              with linked pointers.
            </p>
          </div>

          <Button onClick={() => setShowLegacyModal(true)} variant="outline" size="sm">
            <FilePlus size={15} className="mr-1.5" /> Import Past Legacy Certificate
          </Button>
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
                      {cert.recipientName}
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

                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      {cert.status === "ACTIVE" && (
                        <>
                          <button
                            onClick={() => {
                              setReplacingCert(cert);
                              setCorrectedName(cert.recipientName);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ieee-blue hover:underline bg-ieee-surfaceTint/50 px-2.5 py-1 rounded"
                          >
                            <RefreshCw size={11} /> Replace Name
                          </button>

                          <button
                            onClick={() => setRevokingCert(cert)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#BA0C2F] hover:underline bg-[#FCE8E6] px-2.5 py-1 rounded"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
