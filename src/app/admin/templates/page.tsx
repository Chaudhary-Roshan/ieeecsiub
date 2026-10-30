"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { CertificateTemplate } from "@/types";
import { DEFAULT_CERTIFICATE_HTML } from "@/lib/defaultCertificateHtml";
import { Button } from "@/components/ui/Button";
import QRCode from "qrcode";
import {
  Palette,
  Eye,
  Code2,
  Save,
  RotateCcw,
  Printer,
  Sparkles,
  Copy,
  Check,
  Info,
  UploadCloud,
  Trash2,
  PenTool,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  Plus,
} from "lucide-react";

const PLACEHOLDERS = [
  { tag: "{{chair_signature}}", desc: "Digital Signature of Chapter Chair / Admin" },
  { tag: "{{advisor_signature}}", desc: "Digital Signature of Branch Counselor / Advisor" },
  { tag: "{{recipient_name}}", desc: "Student Full Name" },
  { tag: "{{event_title}}", desc: "Workshop, Seminar, or Expo Title" },
  { tag: "{{activity_date}}", desc: "Date of Event" },
  { tag: "{{certificate_type}}", desc: "e.g. Certificate of Participation" },
  { tag: "{{recognition_level}}", desc: "Chapter Recognition / Joint" },
  { tag: "{{code}}", desc: "Unique Verification Code (CSIUB-26-XXXX)" },
  { tag: "{{qr_code}}", desc: "QR Code Image Source (data:image/png;base64)" },
  { tag: "{{approver_name}}", desc: "Chair / Administrator Name" },
  { tag: "{{advisor_name}}", desc: "Faculty Advisor Name" },
  { tag: "{{team_name}}", desc: "Project Expo Team Name" },
  { tag: "{{project_title}}", desc: "Exhibited Project Title" },
  { tag: "{{member_1}}", desc: "Team Member 1" },
  { tag: "{{member_2}}", desc: "Team Member 2" },
  { tag: "{{society_code}}", desc: "IEEE Chapter Society Code" },
  { tag: "{{chapter_website}}", desc: "Chapter Verification Portal Host" },
  { tag: "{{logo_url}}", desc: "Official IEEE Computer Society Logo URL (/ieee-cs-logo.png)" },
  { tag: "{{issuer_statement}}", desc: "Official Compliance Statement" },
  { tag: "{{issue_date}}", desc: "Issuance Date" },
];

export default function AdminCertificateTemplatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tpl-default");
  const [templateName, setTemplateName] = useState("Official IEEE CS Navy & Gold Border");
  const [htmlCode, setHtmlCode] = useState(DEFAULT_CERTIFICATE_HTML);
  const [activeTab, setActiveTab] = useState<"SPLIT" | "EDITOR" | "PREVIEW">("SPLIT");
  const [sampleQr, setSampleQr] = useState<string>("");
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Signatures Studio State
  const [showSignaturesPanel, setShowSignaturesPanel] = useState(true);
  const [chairSignature, setChairSignature] = useState<string>("");
  const [advisorSignature, setAdvisorSignature] = useState<string>("");
  const [chairName, setChairName] = useState<string>("Muhammad Roshan Ashraf");
  const [chairTitle, setChairTitle] = useState<string>("Chair, IEEE CS Student Branch Chapter");
  const [advisorName, setAdvisorName] = useState<string>("Dr. Asjad Amin");
  const [advisorTitle, setAdvisorTitle] = useState<string>("Advisor, IEEE CS Student Branch Chapter");

  // Load Templates & Cached Signatures
  useEffect(() => {
    // Generate sample QR code for preview
    QRCode.toDataURL("https://ieeecsiub.vercel.app/verify/CSIUB-26-9P4W-M8XB", {
      width: 160,
      margin: 1,
      color: { dark: "#002855", light: "#ffffff" },
    }).then((url) => setSampleQr(url));

    const allTemplates = db.getTemplates();
    setTemplates(allTemplates);
    if (allTemplates.length > 0) {
      const initial = allTemplates[0];
      setSelectedTemplateId(initial.id);
      setTemplateName(initial.name);
      setHtmlCode(initial.htmlContent || DEFAULT_CERTIFICATE_HTML);
      if (initial.chairSignatureUrl) setChairSignature(initial.chairSignatureUrl);
      if (initial.advisorSignatureUrl) setAdvisorSignature(initial.advisorSignatureUrl);
      if (initial.chairName) setChairName(initial.chairName);
      if (initial.advisorName) setAdvisorName(initial.advisorName);
    }

    // Load persisted global signatures if available
    if (typeof window !== "undefined") {
      const savedSigs = localStorage.getItem("ieee_signatures");
      if (savedSigs) {
        try {
          const parsed = JSON.parse(savedSigs);
          if (parsed.chairSignature) setChairSignature((prev) => prev || parsed.chairSignature);
          if (parsed.advisorSignature) setAdvisorSignature((prev) => prev || parsed.advisorSignature);
          if (parsed.chairName) setChairName((prev) => prev || parsed.chairName);
          if (parsed.advisorName) setAdvisorName((prev) => prev || parsed.advisorName);
        } catch (e) {
          console.warn("Failed to load cached signatures:", e);
        }
      }
    }
  }, []);

  // Handle switching templates
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const target = templates.find((t) => t.id === id);
    if (target) {
      setTemplateName(target.name);
      setHtmlCode(target.htmlContent || DEFAULT_CERTIFICATE_HTML);
      if (target.chairSignatureUrl) setChairSignature(target.chairSignatureUrl);
      if (target.advisorSignatureUrl) setAdvisorSignature(target.advisorSignatureUrl);
      if (target.chairName) setChairName(target.chairName);
      if (target.advisorName) setAdvisorName(target.advisorName);
    }
  };

  // Create new blank template
  const handleCreateNewTemplate = () => {
    const newId = `tpl-custom-${Date.now()}`;
    const newName = `Custom Certificate Template #${templates.length + 1}`;
    setSelectedTemplateId(newId);
    setTemplateName(newName);
    setHtmlCode(DEFAULT_CERTIFICATE_HTML);
  };

  // Upload digital signature files
  const handleSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "CHAIR" | "ADVISOR"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG with transparency, JPG, or SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (type === "CHAIR") {
        setChairSignature(dataUrl);
      } else {
        setAdvisorSignature(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Compute rendered HTML with sample values and live signatures
  const getRenderedHtml = () => {
    const chairSigImg = chairSignature
      ? `<img src="${chairSignature}" alt="Chair Signature" style="max-height: 48px; max-width: 140px; object-fit: contain; display: block; margin: 0 auto -6px;" />`
      : `<div style="height: 38px;"></div>`;

    const advisorSigImg = advisorSignature
      ? `<img src="${advisorSignature}" alt="Advisor Signature" style="max-height: 48px; max-width: 140px; object-fit: contain; display: block; margin: 0 auto -6px;" />`
      : `<div style="height: 38px;"></div>`;

    return htmlCode
      .replace(/{{logo_url}}/g, "/ieee-cs-logo.png")
      .replace(/{{chair_signature}}/g, chairSigImg)
      .replace(/{{advisor_signature}}/g, advisorSigImg)
      .replace(/{{recipient_name}}/g, "Muhammad Roshan Ashraf")
      .replace(/{{event_title}}/g, "IEEE DigitalFest 2026 – Projects Expo")
      .replace(/{{activity_date}}/g, "June 03, 2026")
      .replace(/{{certificate_type}}/g, "Certificate of Participation & Project Merit")
      .replace(/{{recognition_level}}/g, "OFFICIAL CHAPTER RECOGNITION")
      .replace(/{{code}}/g, "CSIUB-26-DF01-LIVE")
      .replace(/{{qr_code}}/g, sampleQr || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CSIUB-26-DEMO")
      .replace(/{{approver_name}}/g, chairName || "Muhammad Roshan Ashraf")
      .replace(/{{chair_name}}/g, chairName || "Muhammad Roshan Ashraf")
      .replace(/{{approver_role}}/g, chairTitle || "Chapter Administrator & President")
      .replace(/{{advisor_name}}/g, advisorName || "Dr. Asjad Amin")
      .replace(/{{advisor_role}}/g, advisorTitle || "Faculty Advisor")
      .replace(/{{team_name}}/g, "ByteForge")
      .replace(/{{project_title}}/g, "Synapse Vault")
      .replace(/{{member_1}}/g, "Asadullah Yousaf")
      .replace(/{{member_2}}/g, "Muhammad Ahmad")
      .replace(/{{member_3}}/g, "Ali Raza")
      .replace(/{{member_4}}/g, "Hamza Tariq")
      .replace(/{{society_code}}/g, "01001001 · SBC65421")
      .replace(/{{chapter_website}}/g, "ieeecsiub.vercel.app")
      .replace(/{{issuer_statement}}/g, "This is an official chapter recognition issued by IEEE CS UCET-IUB Student Branch Chapter.")
      .replace(/{{issue_date}}/g, "June 03, 2026");
  };

  const handleCopyPlaceholder = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const handleInsertPlaceholder = (tag: string) => {
    setHtmlCode((prev) => prev + "\n" + tag);
  };

  const handleSave = () => {
    const updated: CertificateTemplate = {
      id: selectedTemplateId || `tpl-${Date.now()}`,
      name: templateName.trim(),
      htmlContent: htmlCode,
      isDefault: true,
      chairSignatureUrl: chairSignature || undefined,
      advisorSignatureUrl: advisorSignature || undefined,
      chairName: chairName.trim(),
      chairTitle: chairTitle.trim(),
      advisorName: advisorName.trim(),
      advisorTitle: advisorTitle.trim(),
      createdAt: new Date().toISOString(),
    };

    db.saveTemplate(updated);

    // Also persist signatures globally in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "ieee_signatures",
        JSON.stringify({
          chairSignature,
          advisorSignature,
          chairName,
          advisorName,
        })
      );
    }

    setTemplates(db.getTemplates());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    db.addAuditLog(
      "Muhammad Roshan Ashraf",
      "TEMPLATE_SAVED",
      "certificate_templates",
      updated.id,
      `Saved custom HTML certificate template "${templateName}" with digital signatures.`
    );
  };

  const handleResetDefault = () => {
    if (confirm("Reset template code to official IEEE CS default?")) {
      setHtmlCode(DEFAULT_CERTIFICATE_HTML);
    }
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(getRenderedHtml());
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 500);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-openSans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider">
              <Palette size={16} /> Certificate Visual Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
              Custom HTML Certificate Designer
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Full visual studio for IEEE certificates: customize layout code, upload authentic digital signatures, and preview live.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
              title="Print preview or export to PDF"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <Button
              onClick={handleSave}
              variant="primary"
              className="flex items-center gap-1.5 shadow-md"
            >
              <Save size={15} /> Save to Database
            </Button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="p-3 bg-[#E6F4EA] border border-[#A8DAB5] rounded-lg text-xs text-[#00843D] flex items-center gap-2">
            <Check size={16} />
            <span>Certificate template and digital signatures successfully saved to database!</span>
          </div>
        )}

        {/* Template Switcher Bar */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Layers size={18} className="text-ieee-blue flex-shrink-0" />
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">
                Select Active Certificate Template:
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full sm:max-w-md mt-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold text-ieee-navy focus:outline-none focus:border-ieee-blue bg-white"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleCreateNewTemplate}
              className="px-3 py-1.5 text-xs font-semibold text-ieee-blue hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> New Template
            </button>
            <button
              onClick={handleResetDefault}
              className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-[11px] px-2 py-1.5 border border-transparent rounded hover:bg-red-50 transition-colors"
              title="Reset code to official IEEE CS default styling"
            >
              <RotateCcw size={12} /> Reset Default
            </button>
          </div>
        </div>

        {/* Digital Signatures Upload Studio Card */}
        <div className="bg-white border border-gray-200 rounded-card shadow-sm overflow-hidden">
          <div
            onClick={() => setShowSignaturesPanel(!showSignaturesPanel)}
            className="p-4 bg-gray-50 hover:bg-gray-100/70 border-b border-gray-200 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-ieee-navy flex items-center justify-center">
                <PenTool size={15} />
              </div>
              <div>
                <span className="font-montserrat font-bold text-sm text-ieee-navy block">
                  Official Digital Signatures Studio
                </span>
                <span className="text-[11px] text-gray-500">
                  Upload transparent signature PNGs to embed directly on certificate signature lines
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span className="hidden sm:inline">
                {chairSignature && advisorSignature
                  ? "Both Signatures Configured"
                  : chairSignature || advisorSignature
                  ? "1 Signature Configured"
                  : "No Signatures Uploaded"}
              </span>
              {showSignaturesPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {showSignaturesPanel && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Signatory 1: Chapter Chair / Lead */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-montserrat font-bold text-xs text-ieee-navy flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-ieee-blue"></span>
                      Signatory 1: Chapter Chair / Lead
                    </span>
                    {chairSignature && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Signature Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Signer Name</label>
                      <input
                        type="text"
                        value={chairName}
                        onChange={(e) => setChairName(e.target.value)}
                        placeholder="Muhammad Roshan Ashraf"
                        className="w-full mt-0.5 p-1.5 text-xs border rounded bg-white font-medium text-gray-800 focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Signer Role</label>
                      <input
                        type="text"
                        value={chairTitle}
                        onChange={(e) => setChairTitle(e.target.value)}
                        placeholder="Chair, IEEE CS UCET-IUB"
                        className="w-full mt-0.5 p-1.5 text-xs border rounded bg-white font-medium text-gray-800 focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                  </div>

                  {/* Signature Image Preview & Upload */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">
                      Chair Signature Image (PNG / Transparent)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-36 h-16 rounded border border-gray-300 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center overflow-hidden p-1 bg-white">
                        {chairSignature ? (
                          <img
                            src={chairSignature}
                            alt="Chair Signature"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No signature</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded text-xs font-semibold text-gray-700 shadow-sm transition-colors">
                          <UploadCloud size={13} className="text-ieee-blue" />
                          <span>Upload Signature</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleSignatureUpload(e, "CHAIR")}
                          />
                        </label>
                        {chairSignature && (
                          <button
                            type="button"
                            onClick={() => setChairSignature("")}
                            className="text-red-500 hover:text-red-700 text-[11px] font-semibold flex items-center gap-1 text-left"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Inserts into template tag <code className="text-ieee-navy font-bold">{"{{chair_signature}}"}</code> above the left line.
                  </p>
                </div>

                {/* Signatory 2: Branch Counselor / Faculty Advisor */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-montserrat font-bold text-xs text-ieee-navy flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-ieee-orange"></span>
                      Signatory 2: Faculty Advisor / Counselor
                    </span>
                    {advisorSignature && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Signature Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Signer Name</label>
                      <input
                        type="text"
                        value={advisorName}
                        onChange={(e) => setAdvisorName(e.target.value)}
                        placeholder="Dr. Asjad Amin"
                        className="w-full mt-0.5 p-1.5 text-xs border rounded bg-white font-medium text-gray-800 focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Signer Role</label>
                      <input
                        type="text"
                        value={advisorTitle}
                        onChange={(e) => setAdvisorTitle(e.target.value)}
                        placeholder="Advisor, IEEE CS UCET-IUB"
                        className="w-full mt-0.5 p-1.5 text-xs border rounded bg-white font-medium text-gray-800 focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                  </div>

                  {/* Signature Image Preview & Upload */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">
                      Advisor Signature Image (PNG / Transparent)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-36 h-16 rounded border border-gray-300 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center overflow-hidden p-1 bg-white">
                        {advisorSignature ? (
                          <img
                            src={advisorSignature}
                            alt="Advisor Signature"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No signature</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded text-xs font-semibold text-gray-700 shadow-sm transition-colors">
                          <UploadCloud size={13} className="text-ieee-orange" />
                          <span>Upload Signature</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleSignatureUpload(e, "ADVISOR")}
                          />
                        </label>
                        {advisorSignature && (
                          <button
                            type="button"
                            onClick={() => setAdvisorSignature("")}
                            className="text-red-500 hover:text-red-700 text-[11px] font-semibold flex items-center gap-1 text-left"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Inserts into template tag <code className="text-ieee-navy font-bold">{"{{advisor_signature}}"}</code> above the right line.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Placeholders Toolbar */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-montserrat font-bold text-ieee-navy flex items-center gap-1.5">
              <Sparkles size={14} className="text-ieee-orange" /> Dynamic Tags (Click to copy or insert):
            </span>
            <span className="text-[11px] text-gray-400">
              Hover to view description · Auto-replaced on certificate issuance
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.tag}
                type="button"
                onClick={() => handleCopyPlaceholder(p.tag)}
                className="inline-flex items-center gap-1 bg-gray-50 hover:bg-blue-50 hover:border-ieee-blue border border-gray-200 text-gray-700 text-[11px] font-mono px-2 py-0.5 rounded transition-all"
                title={`${p.desc} - Click to copy`}
              >
                <span>{p.tag}</span>
                {copiedTag === p.tag ? (
                  <Check size={11} className="text-emerald-600" />
                ) : (
                  <Copy size={11} className="text-gray-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Template Title & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <label className="font-bold text-gray-700">Template Name:</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-xs font-bold text-ieee-navy focus:outline-none focus:border-ieee-blue bg-white"
            />
          </div>

          {/* View Toggles */}
          <div className="inline-flex bg-gray-200 p-0.5 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("SPLIT")}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === "SPLIT" ? "bg-white text-ieee-navy shadow-sm" : "text-gray-600"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab("EDITOR")}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === "EDITOR" ? "bg-white text-ieee-navy shadow-sm" : "text-gray-600"
              }`}
            >
              <Code2 size={13} className="inline mr-1" /> HTML Code
            </button>
            <button
              onClick={() => setActiveTab("PREVIEW")}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === "PREVIEW" ? "bg-white text-ieee-navy shadow-sm" : "text-gray-600"
              }`}
            >
              <Eye size={13} className="inline mr-1" /> Live Preview
            </button>
          </div>
        </div>

        {/* Editor & Preview Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[640px]">
          {/* HTML Code Editor */}
          {(activeTab === "SPLIT" || activeTab === "EDITOR") && (
            <div
              className={`bg-gray-900 rounded-card p-4 flex flex-col ${
                activeTab === "EDITOR" ? "lg:col-span-2" : ""
              }`}
            >
              <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-2 mb-2 font-mono">
                <span>certificate-template.html</span>
                <span className="text-[11px] text-gray-500">HTML5 + Inline CSS Canvas</span>
              </div>
              <textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                className="w-full flex-1 bg-transparent text-gray-100 font-mono text-xs p-2 focus:outline-none resize-none leading-relaxed"
                rows={28}
                spellCheck={false}
              />
            </div>
          )}

          {/* Live Preview Iframe */}
          {(activeTab === "SPLIT" || activeTab === "PREVIEW") && (
            <div
              className={`bg-white border border-gray-300 rounded-card p-3 shadow-sm flex flex-col ${
                activeTab === "PREVIEW" ? "lg:col-span-2" : ""
              }`}
            >
              <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-2 mb-2">
                <span className="font-montserrat font-bold text-ieee-navy flex items-center gap-1.5">
                  <Eye size={14} className="text-ieee-blue" /> Live Certificate Render (with Uploaded Signatures)
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  ● Real-time synced
                </span>
              </div>

              <div className="flex-1 w-full bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center p-2">
                <iframe
                  ref={iframeRef}
                  srcDoc={getRenderedHtml()}
                  title="Certificate Visual Studio Preview"
                  className="w-full h-full min-h-[580px] border-0 rounded bg-white shadow"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
