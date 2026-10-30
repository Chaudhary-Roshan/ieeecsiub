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
} from "lucide-react";

const PLACEHOLDERS = [
  { tag: "{{recipient_name}}", desc: "Student Full Name" },
  { tag: "{{event_title}}", desc: "Workshop or Seminar Title" },
  { tag: "{{activity_date}}", desc: "Date of Event" },
  { tag: "{{certificate_type}}", desc: "e.g. Certificate of Participation" },
  { tag: "{{recognition_level}}", desc: "Chapter Recognition / Joint" },
  { tag: "{{code}}", desc: "Unique Verification Code (CSIUB-26-XXXX)" },
  { tag: "{{qr_code}}", desc: "QR Code Image Source (data:image/png;base64)" },
  { tag: "{{approver_name}}", desc: "Approver / Admin Name" },
  { tag: "{{approver_role}}", desc: "Approver Official Role" },
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
      setSelectedTemplateId(allTemplates[0].id);
      setTemplateName(allTemplates[0].name);
      setHtmlCode(allTemplates[0].htmlContent || DEFAULT_CERTIFICATE_HTML);
    }
  }, []);

  // Compute rendered HTML with sample values
  const getRenderedHtml = () => {
    return htmlCode
      .replace(/{{recipient_name}}/g, "Ahmad Bilal")
      .replace(/{{event_title}}/g, "Hands-on Modern AI Agent Development with Next.js & Python")
      .replace(/{{activity_date}}/g, "November 16, 2026")
      .replace(/{{certificate_type}}/g, "Certificate of Completion")
      .replace(/{{recognition_level}}/g, "CHAPTER RECOGNITION")
      .replace(/{{code}}/g, "CSIUB-26-9P4W-M8XB")
      .replace(/{{qr_code}}/g, sampleQr || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CSIUB-26-DEMO")
      .replace(/{{approver_name}}/g, "Muhammad Roshan Ashraf")
      .replace(/{{approver_role}}/g, "Lead Administrator & Chapter Chair")
      .replace(/{{issuer_statement}}/g, "This is an official chapter recognition issued by IEEE CS UCET-IUB Student Branch Chapter.")
      .replace(/{{issue_date}}/g, new Date().toISOString().split("T")[0]);
  };

  const handleCopyPlaceholder = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const handleInsertPlaceholder = (tag: string) => {
    setHtmlCode((prev) => prev + " " + tag);
  };

  const handleSave = () => {
    const updated: CertificateTemplate = {
      id: selectedTemplateId || `tpl-${Date.now()}`,
      name: templateName.trim(),
      htmlContent: htmlCode,
      isDefault: true,
      createdAt: new Date().toISOString(),
    };

    db.saveTemplate(updated);
    setTemplates(db.getTemplates());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    db.addAuditLog(
      "Muhammad Roshan Ashraf",
      "TEMPLATE_SAVED",
      "certificate_templates",
      updated.id,
      `Saved custom HTML certificate template "${templateName}".`
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
              Edit the HTML/CSS certificate template with dynamic placeholders and preview the exact output in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <Button
              onClick={handleSave}
              variant="primary"
              className="flex items-center gap-1.5 shadow-md"
            >
              <Save size={15} /> Save Template
            </Button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="p-3 bg-[#E6F4EA] border border-[#A8DAB5] rounded-lg text-xs text-[#00843D] flex items-center gap-2">
            <Check size={16} />
            <span>Template successfully saved to database and active for certificate issuance!</span>
          </div>
        )}

        {/* Placeholders Toolbar */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-montserrat font-bold text-ieee-navy flex items-center gap-1.5">
              <Sparkles size={14} className="text-ieee-orange" /> Available Dynamic Placeholders (Click to copy or insert):
            </span>
            <span className="text-[11px] text-gray-400">
              Replaced with actual participant & event data on issuance
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.tag}
                type="button"
                onClick={() => handleCopyPlaceholder(p.tag)}
                className="inline-flex items-center gap-1 bg-gray-50 hover:bg-ieee-surfaceTint hover:border-ieee-blue border border-gray-200 text-gray-700 text-[11px] font-mono px-2.5 py-1 rounded transition-all"
                title={`${p.desc} - Click to copy`}
              >
                <span>{p.tag}</span>
                {copiedTag === p.tag ? (
                  <Check size={11} className="text-status-active" />
                ) : (
                  <Copy size={11} className="text-gray-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Template Settings & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-600">Template Title:</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold text-ieee-navy focus:outline-none focus:ring-1 focus:ring-ieee-blue bg-white"
            />
            <button
              onClick={handleResetDefault}
              className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-[11px] ml-2"
              title="Reset to official IEEE CS styling"
            >
              <RotateCcw size={12} /> Reset Default
            </button>
          </div>

          {/* View Toggles */}
          <div className="inline-flex bg-gray-200 p-0.5 rounded-lg">
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
            <div className={`bg-gray-900 rounded-card p-4 flex flex-col ${activeTab === "EDITOR" ? "lg:col-span-2" : ""}`}>
              <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-2 mb-2 font-mono">
                <span>certificate-template.html</span>
                <span className="text-[11px] text-gray-500">Pure HTML5 + Inline CSS</span>
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
            <div className={`bg-white border border-gray-300 rounded-card p-3 shadow-sm flex flex-col ${activeTab === "PREVIEW" ? "lg:col-span-2" : ""}`}>
              <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-2 mb-2">
                <span className="font-montserrat font-bold text-ieee-navy flex items-center gap-1.5">
                  <Eye size={14} className="text-ieee-blue" /> Live Certificate Render (Sample Data)
                </span>
                <span className="text-[11px] text-status-active font-semibold">● Real-time synced</span>
              </div>

              <div className="flex-1 w-full bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center p-2">
                <iframe
                  ref={iframeRef}
                  srcDoc={getRenderedHtml()}
                  title="Certificate Preview"
                  className="w-full h-full min-h-[580px] border-0 rounded bg-white"
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

