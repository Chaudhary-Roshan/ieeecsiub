import QRCode from "qrcode";
import { CertificateRecord, CertificateTemplate } from "@/types";
import { db } from "./db";
import { CHAPTER_INFO } from "./constants";
import { formatPKTDateOnly } from "./sha256";

export async function renderCertificateHtml(
  cert: CertificateRecord,
  customTemplate?: CertificateTemplate
): Promise<string> {
  // 1. Resolve template: Custom passed -> Certificate's assigned template -> Active default -> First available
  let template: CertificateTemplate | undefined = customTemplate;
  if (!template && cert.templateId) {
    template = db.getTemplateById(cert.templateId);
  }
  if (!template) {
    template = db.getActiveTemplate();
  }

  const rawHtml = template?.htmlContent || "";

  // 2. Generate Real Verification QR Code Data URL
  const verifyUrl = `https://ieeecsiub.vercel.app/verify/${cert.code}`;
  let qrDataUri = "";
  try {
    qrDataUri = await QRCode.toDataURL(verifyUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: "#002855",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });
  } catch (e) {
    console.error("QR Code generation error:", e);
  }

  // 3. Resolve Signatures & Logos from template or global localStorage cache
  let globalSignatures: any = {};
  let globalLogos: any = {};
  if (typeof window !== "undefined") {
    try {
      const sigs = localStorage.getItem("ieee_signatures");
      if (sigs) globalSignatures = JSON.parse(sigs);
      const logos = localStorage.getItem("ieee_logos");
      if (logos) globalLogos = JSON.parse(logos);
    } catch {}
  }

  const chairSigUrl = template?.chairSignatureUrl || globalSignatures.chairSignature || "";
  const advisorSigUrl = template?.advisorSignatureUrl || globalSignatures.advisorSignature || "";
  const chairName = template?.chairName || globalSignatures.chairName || cert.approverName || "Muhammad Roshan Ashraf";
  const advisorName = template?.advisorName || globalSignatures.advisorName || "Dr. Asjad Amin";

  const chapterLogo = template?.chapterLogoUrl || globalLogos.chapterLogo || "/ieee-cs-logo.png";
  const universityLogo = template?.universityLogoUrl || globalLogos.universityLogo || "/logo.png";
  const ieeeLogo = template?.ieeeLogoUrl || globalLogos.ieeeLogo || "/ieee-logo.svg";
  const eventLogo = template?.eventLogoUrl || globalLogos.eventLogo || "";

  const chairSigHtml = chairSigUrl
    ? `<img src="${chairSigUrl}" alt="Chair Signature" style="max-height: 48px; max-width: 160px; object-fit: contain; display: block; margin: 0 auto;" />`
    : `<div style="height: 36px"></div>`;

  const advisorSigHtml = advisorSigUrl
    ? `<img src="${advisorSigUrl}" alt="Advisor Signature" style="max-height: 48px; max-width: 160px; object-fit: contain; display: block; margin: 0 auto;" />`
    : `<div style="height: 36px"></div>`;

  const activeIeeeLogoHtml = `<img src="${ieeeLogo}" alt="IEEE Logo" style="max-height: 46px; max-width: 110px; object-fit: contain; display: block; margin: auto;" />`;

  const activeEventLogoHtml = eventLogo
    ? `<img src="${eventLogo}" alt="Event / Partner Logo" style="max-height: 52px; max-width: 140px; object-fit: contain; display: inline-block;" />`
    : "";

  // 4. Perform dynamic placeholders replacement
  let rendered = rawHtml
    // Recipient and Event Details
    .replace(/{{recipient_name}}/g, cert.recipientName || "Recipient Name")
    .replace(/{{event_title}}/g, cert.eventTitle || "Official Event")
    .replace(/{{certificate_type}}/g, cert.certificateType || "Certificate of Participation")
    .replace(/{{recognition_level}}/g, cert.recognitionLevel || "CHAPTER_RECOGNITION")
    .replace(/{{activity_date}}/g, formatPKTDateOnly(cert.activityDate))
    .replace(/{{issue_date}}/g, formatPKTDateOnly(cert.issueDate))
    .replace(/{{code}}/g, cert.code)
    .replace(/{{qr_code}}/g, qrDataUri)
    .replace(/{{society_code}}/g, "SBC12345")
    .replace(/{{chapter_website}}/g, "ieeecsiub.vercel.app")
    .replace(/{{issuer_statement}}/g, cert.issuerStatement || CHAPTER_INFO.issuerStatementDefault)

    // Team & Project (Projects Expo templates)
    .replace(/{{team_name}}/g, cert.teamName || cert.recipientName)
    .replace(/{{project_title}}/g, cert.projectTitle || cert.eventTitle)
    .replace(/{{member_1}}/g, cert.recipientName)
    .replace(/{{member_2}}/g, "")
    .replace(/{{member_3}}/g, "")
    .replace(/{{member_4}}/g, "")

    // Signatures
    .replace(/{{chair_signature}}/g, chairSigHtml)
    .replace(/{{advisor_signature}}/g, advisorSigHtml)
    .replace(/{{approver_name}}/g, chairName)
    .replace(/{{approver_role}}/g, cert.approverRole || "Chair, IEEE CS Student Branch Chapter")
    .replace(/{{advisor_name}}/g, advisorName)

    // Logos
    .replace(/src=["']{{chapter_logo}}["']/g, `src="${chapterLogo}"`)
    .replace(/{{chapter_logo}}/g, chapterLogo)
    .replace(/{{logo_url}}/g, chapterLogo)
    .replace(/src=["']\/ieee-cs-logo\.png["']/g, `src="${chapterLogo}"`)
    .replace(/src=["']\/ieee-cs-logo-white\.png["']/g, `src="${chapterLogo}"`)

    .replace(/src=["']{{university_logo}}["']/g, `src="${universityLogo}"`)
    .replace(/src=["']\/logo\.png["']/g, `src="${universityLogo}"`)
    .replace(/{{university_logo}}/g, `<img src="${universityLogo}" alt="University Logo" style="max-height: 60px; max-width: 140px; object-fit: contain; display: inline-block;" />`)

    .replace(/src=["']{{ieee_logo}}["']/g, `src="${ieeeLogo}"`)
    .replace(/{{ieee_logo}}/g, activeIeeeLogoHtml)

    .replace(/src=["']{{event_logo}}["']/g, `src="${eventLogo}"`)
    .replace(/{{event_logo}}/g, activeEventLogoHtml);

  // 5. Intelligent fallback: if ieeeLogo exists, replace any hardcoded IEEE emblem box container or standalone text
  if (ieeeLogo) {
    rendered = rendered.replace(
      /<div([^>]*style=["'][^"']*(?:width|height)[^"']*["'][^>]*)>\s*IEEE\s*<\/div>/gi,
      (match, attrs) => `<div${attrs}><img src="${ieeeLogo}" alt="IEEE Logo" style="max-height: 90%; max-width: 90%; object-fit: contain; display: block; margin: auto;" /></div>`
    );
    rendered = rendered.replace(
      /<div([^>]*style=["'][^"']*(?:padding|border)[^"']*["'][^>]*)>\s*IEEE\s*<\/div>/gi,
      (match, attrs) => `<div${attrs}><img src="${ieeeLogo}" alt="IEEE Logo" style="max-height: 90%; max-width: 90%; object-fit: contain; display: block; margin: auto;" /></div>`
    );
    rendered = rendered.replace(
      /<div([^>]*)>\s*IEEE\s*<\/div>/gi,
      `<img src="${ieeeLogo}" alt="IEEE Logo" style="max-height: 48px; max-width: 120px; object-fit: contain; display: inline-block; vertical-align: middle;" />`
    );
  }

  return rendered;
}
