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
  CheckCircle,
  Star,
  Plus,
} from "lucide-react";

const PLACEHOLDERS = [
  { tag: "{{chair_signature}}", desc: "Digital Signature of Chapter Chair / Admin" },
  { tag: "{{advisor_signature}}", desc: "Digital Signature of Branch Counselor / Advisor" },
  { tag: "{{chapter_logo}}", desc: "Official IEEE CS Chapter Logo URL (/ieee-cs-logo.png)" },
  { tag: "{{university_logo}}", desc: "University Logo (IUB UCET) Image Element" },
  { tag: "{{ieee_logo}}", desc: "IEEE Master / Emblem Logo Image Element" },
  { tag: "{{event_logo}}", desc: "Event / Partner / Sponsor Logo Image Element" },
  { tag: "{{logo_url}}", desc: "Primary Chapter Logo URL (/ieee-cs-logo.png)" },
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
  const [showSignaturesPanel, setShowSignaturesPanel] = useState(false);
  const [chairSignature, setChairSignature] = useState<string>("");
  const [advisorSignature, setAdvisorSignature] = useState<string>("");
  const [chairName, setChairName] = useState<string>("Muhammad Roshan Ashraf");
  const [chairTitle, setChairTitle] = useState<string>("Chair, IEEE CS Student Branch Chapter");
  const [advisorName, setAdvisorName] = useState<string>("Dr. Asjad Amin");
  const [advisorTitle, setAdvisorTitle] = useState<string>("Advisor, IEEE CS Student Branch Chapter");

  // Logos Studio State
  const [showLogosPanel, setShowLogosPanel] = useState(true);
  const [chapterLogo, setChapterLogo] = useState<string>("/ieee-cs-logo.png");
  const [universityLogo, setUniversityLogo] = useState<string>("/logo.png");
  const [ieeeLogo, setIeeeLogo] = useState<string>("");
  const [eventLogo, setEventLogo] = useState<string>("");

  // Load Templates & Cached Signatures/Logos
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
      let initialHtml = initial.htmlContent || DEFAULT_CERTIFICATE_HTML;
      initialHtml = initialHtml
        .replace(/<div style="width: 80px; height: 54px; background: #FFFFFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: Montserrat, sans-serif; font-weight: 800; font-size: 16px; color: #00629B">IEEE<\/div>/g, '<div style="width: 80px; height: 54px; background: #FFFFFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px">{{ieee_logo}}</div>')
        .replace(/<div style="font-family: Montserrat, sans-serif; font-weight: 800; font-size: 20px; color: #00629B; letter-spacing: 0.08em">IEEE<\/div>/g, '{{ieee_logo}}');
      setHtmlCode(initialHtml);
      if (initial.chairSignatureUrl) setChairSignature(initial.chairSignatureUrl);
      if (initial.advisorSignatureUrl) setAdvisorSignature(initial.advisorSignatureUrl);
      if (initial.chairName) setChairName(initial.chairName);
      if (initial.advisorName) setAdvisorName(initial.advisorName);
      if (initial.chapterLogoUrl) setChapterLogo(initial.chapterLogoUrl);
      if (initial.universityLogoUrl) setUniversityLogo(initial.universityLogoUrl);
      if (initial.ieeeLogoUrl) setIeeeLogo(initial.ieeeLogoUrl);
      if (initial.eventLogoUrl) setEventLogo(initial.eventLogoUrl);
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

      const savedLogos = localStorage.getItem("ieee_logos");
      if (savedLogos) {
        try {
          const parsed = JSON.parse(savedLogos);
          if (parsed.chapterLogo) setChapterLogo((prev) => prev || parsed.chapterLogo);
          if (parsed.universityLogo) setUniversityLogo((prev) => prev || parsed.universityLogo);
          if (parsed.ieeeLogo) setIeeeLogo((prev) => prev || parsed.ieeeLogo);
          if (parsed.eventLogo) setEventLogo((prev) => prev || parsed.eventLogo);
        } catch (e) {
          console.warn("Failed to load cached logos:", e);
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
      let cleanHtml = target.htmlContent || DEFAULT_CERTIFICATE_HTML;
      cleanHtml = cleanHtml
        .replace(/<div style="width: 80px; height: 54px; background: #FFFFFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: Montserrat, sans-serif; font-weight: 800; font-size: 16px; color: #00629B">IEEE<\/div>/g, '<div style="width: 80px; height: 54px; background: #FFFFFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px">{{ieee_logo}}</div>')
        .replace(/<div style="font-family: Montserrat, sans-serif; font-weight: 800; font-size: 20px; color: #00629B; letter-spacing: 0.08em">IEEE<\/div>/g, '{{ieee_logo}}');
      setHtmlCode(cleanHtml);

      // Load signatures (template-specific or global cache fallback)
      let cachedSigs: any = {};
      let cachedLogos: any = {};
      if (typeof window !== "undefined") {
        try {
          cachedSigs = JSON.parse(localStorage.getItem("ieee_signatures") || "{}");
          cachedLogos = JSON.parse(localStorage.getItem("ieee_logos") || "{}");
        } catch {}
      }

      setChairSignature(target.chairSignatureUrl || cachedSigs.chairSignature || "");
      setAdvisorSignature(target.advisorSignatureUrl || cachedSigs.advisorSignature || "");
      setChairName(target.chairName || cachedSigs.chairName || "Muhammad Roshan Ashraf");
      setAdvisorName(target.advisorName || cachedSigs.advisorName || "Dr. Asjad Amin");

      setChapterLogo(target.chapterLogoUrl || cachedLogos.chapterLogo || "/ieee-cs-logo.png");
      setUniversityLogo(target.universityLogoUrl || cachedLogos.universityLogo || "/logo.png");
      setIeeeLogo(target.ieeeLogoUrl || cachedLogos.ieeeLogo || "");
      setEventLogo(target.eventLogoUrl || cachedLogos.eventLogo || "");
    }
  };

  // Set the currently viewed template as the system-wide active default issuing template
  const handleSetActiveIssuingTemplate = () => {
    if (!selectedTemplateId) return;
    db.setActiveTemplate(selectedTemplateId);
    const updated = db.getTemplates();
    setTemplates(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    alert(`⭐ Success! "${templateName}" is now set as the active certificate template for all issuance and verification across the platform!`);
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

  // Upload logo files
  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "CHAPTER" | "UNIVERSITY" | "IEEE" | "EVENT"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG with transparency, SVG, or JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const cached = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("ieee_logos") || "{}") : {};

      if (type === "CHAPTER") {
        setChapterLogo(dataUrl);
        cached.chapterLogo = dataUrl;
      } else if (type === "UNIVERSITY") {
        setUniversityLogo(dataUrl);
        cached.universityLogo = dataUrl;
      } else if (type === "IEEE") {
        setIeeeLogo(dataUrl);
        cached.ieeeLogo = dataUrl;
        setHtmlCode((prev) =>
          prev
            .replace(/<div style="width: 80px; height: 54px; background: #FFFFFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: Montserrat, sans-serif; font-weight: 800; font-size: 16px; color: #00629B">IEEE<\/div>/g, '<div style="width: 80px; height: 54px; background: #FFFFFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px">{{ieee_logo}}</div>')
            .replace(/<div style="font-family: Montserrat, sans-serif; font-weight: 800; font-size: 20px; color: #00629B; letter-spacing: 0.08em">IEEE<\/div>/g, '{{ieee_logo}}')
        );
      } else if (type === "EVENT") {
        setEventLogo(dataUrl);
        cached.eventLogo = dataUrl;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("ieee_logos", JSON.stringify(cached));
      }
    };
    reader.readAsDataURL(file);
  };

  // Compute rendered HTML with sample values, live signatures, and live logos
  const getRenderedHtml = () => {
    const chairSigImg = chairSignature
      ? `<img src="${chairSignature}" alt="Chair Signature" style="max-height: 48px; max-width: 140px; object-fit: contain; display: block; margin: 0 auto -6px;" />`
      : `<div style="height: 38px;"></div>`;

    const advisorSigImg = advisorSignature
      ? `<img src="${advisorSignature}" alt="Advisor Signature" style="max-height: 48px; max-width: 140px; object-fit: contain; display: block; margin: 0 auto -6px;" />`
      : `<div style="height: 38px;"></div>`;

    const activeChapterLogo = chapterLogo || "/ieee-cs-logo.png";
    const activeUnivLogo = universityLogo || "/logo.png";
    const activeIeeeLogo = ieeeLogo
      ? `<img src="${ieeeLogo}" alt="IEEE Logo" style="max-height: 46px; max-width: 110px; object-fit: contain; display: block; margin: auto;" />`
      : `<div style="font-family: Montserrat, sans-serif; font-weight: 800; font-size: 20px; color: #00629B; letter-spacing: 0.08em">IEEE</div>`;
    const activeEventLogo = eventLogo
      ? `<img src="${eventLogo}" alt="Event / Sponsor Logo" style="max-height: 52px; max-width: 140px; object-fit: contain; display: inline-block;" />`
      : "";

    let rendered = htmlCode
      // Logos dynamic tags
      .replace(/{{chapter_logo}}/g, activeChapterLogo)
      .replace(/{{logo_url}}/g, activeChapterLogo)
      .replace(/src=["']\/ieee-cs-logo\.png["']/g, `src="${activeChapterLogo}"`)
      .replace(/src=["']\/ieee-cs-logo-white\.png["']/g, `src="${activeChapterLogo}"`)
      .replace(/src=["']\/logo\.png["']/g, `src="${activeUnivLogo}"`)
      .replace(/{{university_logo}}/g, `<img src="${activeUnivLogo}" alt="University Logo" style="max-height: 60px; max-width: 140px; object-fit: contain; display: inline-block;" />`)
      .replace(/{{ieee_logo}}/g, activeIeeeLogo)
      .replace(/{{event_logo}}/g, activeEventLogo)
      // Signatures
      .replace(/{{chair_signature}}/g, chairSigImg)
      .replace(/{{advisor_signature}}/g, advisorSigImg)
      // Core metadata
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

    // Dynamic replacement for templates with hardcoded IEEE emblem box containers or text
    if (ieeeLogo) {
      // 1. Box container (e.g. Projects Expo 80x54 white box)
      rendered = rendered.replace(
        /<div([^>]*style=["'][^"']*(?:width|height)[^"']*["'][^>]*)>\s*IEEE\s*<\/div>/gi,
        (fullMatch, attrs) => {
          return `<div${attrs}><img src="${ieeeLogo}" alt="IEEE Logo" style="max-height: 90%; max-width: 90%; object-fit: contain; display: block; margin: auto;" /></div>`;
        }
      );

      // 2. Standalone text block
      rendered = rendered.replace(
        /<div([^>]*)>\s*IEEE\s*<\/div>/gi,
        `<img src="${ieeeLogo}" alt="IEEE Logo" style="max-height: 48px; max-width: 120px; object-fit: contain; display: inline-block; vertical-align: middle;" />`
      );
    }

    return rendered;
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
      chapterLogoUrl: chapterLogo || undefined,
      universityLogoUrl: universityLogo || undefined,
      ieeeLogoUrl: ieeeLogo || undefined,
      eventLogoUrl: eventLogo || undefined,
      createdAt: new Date().toISOString(),
    };

    db.saveTemplate(updated);

    // Also persist signatures & logos globally in localStorage
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
      localStorage.setItem(
        "ieee_logos",
        JSON.stringify({
          chapterLogo,
          universityLogo,
          ieeeLogo,
          eventLogo,
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
      `Saved custom HTML certificate template "${templateName}" with digital signatures and official logos.`
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
                    {tpl.name} {tpl.isDefault ? "★ (Active Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 flex-wrap">
            {templates.find((t) => t.id === selectedTemplateId)?.isDefault ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold shadow-sm">
                <CheckCircle size={14} className="text-emerald-600" /> Active Issuing Template
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSetActiveIssuingTemplate}
                className="px-3 py-1.5 text-xs font-bold text-white bg-ieee-orange hover:bg-orange-600 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                title="Make this template the system default for all certificates"
              >
                <Star size={14} className="fill-white" /> Set as Active Issuing Template
              </button>
            )}

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

        {/* Official Certificate Logos Studio Card */}
        <div className="bg-white border border-gray-200 rounded-card shadow-sm overflow-hidden">
          <div
            onClick={() => setShowLogosPanel(!showLogosPanel)}
            className="p-4 bg-gray-50 hover:bg-gray-100/70 border-b border-gray-200 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <ImageIcon size={15} />
              </div>
              <div>
                <span className="font-montserrat font-bold text-sm text-ieee-navy block">
                  Official Certificate Logos Studio
                </span>
                <span className="text-[11px] text-gray-500">
                  Upload, customize and replace logos across all certificate templates and database
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span className="hidden sm:inline">
                {[chapterLogo, universityLogo, ieeeLogo, eventLogo].filter(Boolean).length} Logos Active
              </span>
              {showLogosPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {showLogosPanel && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Logo 1: IEEE Computer Society Chapter Logo */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-montserrat font-bold text-xs text-ieee-navy truncate">
                        1. IEEE CS Chapter Logo
                      </span>
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        {chapterLogo.startsWith("data:") ? "Custom" : "Default"}
                      </span>
                    </div>
                    <div className="w-full h-20 rounded border border-gray-300 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center overflow-hidden p-2 bg-white">
                      <img
                        src={chapterLogo || "/ieee-cs-logo.png"}
                        alt="Chapter Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded text-[11px] font-semibold text-gray-700 shadow-sm transition-colors">
                        <UploadCloud size={12} className="text-ieee-blue" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload(e, "CHAPTER")}
                        />
                      </label>
                      {chapterLogo !== "/ieee-cs-logo.png" && (
                        <button
                          type="button"
                          onClick={() => setChapterLogo("/ieee-cs-logo.png")}
                          className="px-2 py-1.5 text-[11px] text-gray-500 hover:text-red-600 border border-gray-300 rounded bg-white hover:bg-red-50"
                          title="Reset to official /ieee-cs-logo.png"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Tag:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPlaceholder("{{chapter_logo}}")}
                        className="text-ieee-blue hover:underline font-mono font-bold"
                      >
                        {"{{chapter_logo}}"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logo 2: University / Department Logo (IUB UCET) */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-montserrat font-bold text-xs text-ieee-navy truncate">
                        2. University Logo (IUB)
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        {universityLogo.startsWith("data:") ? "Custom" : "Default"}
                      </span>
                    </div>
                    <div className="w-full h-20 rounded border border-gray-300 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center overflow-hidden p-2 bg-white">
                      <img
                        src={universityLogo || "/logo.png"}
                        alt="University Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded text-[11px] font-semibold text-gray-700 shadow-sm transition-colors">
                        <UploadCloud size={12} className="text-ieee-blue" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload(e, "UNIVERSITY")}
                        />
                      </label>
                      {universityLogo !== "/logo.png" && (
                        <button
                          type="button"
                          onClick={() => setUniversityLogo("/logo.png")}
                          className="px-2 py-1.5 text-[11px] text-gray-500 hover:text-red-600 border border-gray-300 rounded bg-white hover:bg-red-50"
                          title="Reset to official /logo.png"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Tag:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPlaceholder("{{university_logo}}")}
                        className="text-ieee-blue hover:underline font-mono font-bold"
                      >
                        {"{{university_logo}}"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logo 3: IEEE Master Emblem / Wordmark */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-montserrat font-bold text-xs text-ieee-navy truncate">
                        3. IEEE Emblem Logo
                      </span>
                      <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                        {ieeeLogo ? "Active" : "Text Default"}
                      </span>
                    </div>
                    <div className="w-full h-20 rounded border border-gray-300 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center overflow-hidden p-2 bg-white">
                      {ieeeLogo ? (
                        <img
                          src={ieeeLogo}
                          alt="IEEE Emblem"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="font-montserrat font-extrabold text-xl text-ieee-blue tracking-wider">
                          IEEE
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded text-[11px] font-semibold text-gray-700 shadow-sm transition-colors">
                        <UploadCloud size={12} className="text-purple-600" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload(e, "IEEE")}
                        />
                      </label>
                      {ieeeLogo && (
                        <button
                          type="button"
                          onClick={() => setIeeeLogo("")}
                          className="px-2 py-1.5 text-[11px] text-red-500 hover:text-red-700 border border-gray-300 rounded bg-white hover:bg-red-50"
                          title="Remove custom IEEE logo"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Tag:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPlaceholder("{{ieee_logo}}")}
                        className="text-ieee-blue hover:underline font-mono font-bold"
                      >
                        {"{{ieee_logo}}"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logo 4: Event / Partner / Sponsor Logo */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-montserrat font-bold text-xs text-ieee-navy truncate">
                        4. Event / Partner Logo
                      </span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                        {eventLogo ? "Active" : "Optional"}
                      </span>
                    </div>
                    <div className="w-full h-20 rounded border border-gray-300 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center overflow-hidden p-2 bg-white">
                      {eventLogo ? (
                        <img
                          src={eventLogo}
                          alt="Event / Partner Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No partner logo</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded text-[11px] font-semibold text-gray-700 shadow-sm transition-colors">
                        <UploadCloud size={12} className="text-ieee-orange" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload(e, "EVENT")}
                        />
                      </label>
                      {eventLogo && (
                        <button
                          type="button"
                          onClick={() => setEventLogo("")}
                          className="px-2 py-1.5 text-[11px] text-red-500 hover:text-red-700 border border-gray-300 rounded bg-white hover:bg-red-50"
                          title="Remove event logo"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Tag:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPlaceholder("{{event_logo}}")}
                        className="text-ieee-blue hover:underline font-mono font-bold"
                      >
                        {"{{event_logo}}"}
                      </button>
                    </div>
                  </div>
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
                  key={`${selectedTemplateId}-${ieeeLogo ? 'ieee' : 'noieee'}-${chapterLogo ? 'chap' : ''}-${universityLogo ? 'univ' : ''}`}
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
