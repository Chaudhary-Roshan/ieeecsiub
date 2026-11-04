import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { CertificateRecord } from "@/types";
import { CHAPTER_INFO } from "./constants";
import { formatPKTDateOnly } from "./sha256";
import { IEEE_CS_LOGO_COLOR_DATA_URI } from "./logoBase64";
import { formatTeamMembersBullets, formatTeamMembersProse } from "./teamCertUtils";

export async function generateVerificationSummaryPdf(
  cert: CertificateRecord
): Promise<jsPDF> {
  // A4 Portrait: 210mm x 297mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182

  // 1. Top Decorative Brand Stripes
  doc.setFillColor(0, 40, 85); // Navy #002855
  doc.rect(0, 0, pageWidth, 4.5, "F");

  doc.setFillColor(255, 163, 0); // Orange / Gold #FFA300
  doc.rect(0, 4.5, pageWidth, 2, "F");

  // 2. Official Header
  let currentY = 14;

  // Embed Logo (left)
  try {
    const logoWidth = 36;
    const logoHeight = 11;
    doc.addImage(
      IEEE_CS_LOGO_COLOR_DATA_URI,
      "PNG",
      marginX,
      currentY,
      logoWidth,
      logoHeight
    );
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 40, 85);
    doc.text("IEEE COMPUTER SOCIETY", marginX, currentY + 6);
  }

  // Institutional Header Text (Right aligned / Center offset)
  const headerTextX = marginX + 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 40, 85);
  doc.text("IEEE COMPUTER SOCIETY STUDENT BRANCH CHAPTER", headerTextX, currentY + 3.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 85, 95);
  doc.text(
    "University College of Engineering & Technology • The Islamia University of Bahawalpur",
    headerTextX,
    currentY + 7.5
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 98, 155); // IEEE Blue
  doc.text(
    "OFFICIAL CREDENTIAL VERIFICATION RECORD",
    headerTextX,
    currentY + 11.5
  );

  currentY += 15;

  // Thin separator line
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 4;

  // 3. Status Verification Banner
  const isRevoked = cert.status === "REVOKED";
  const isReplaced = cert.status === "REPLACED";
  const isActive = cert.status === "ACTIVE";

  if (isActive) {
    doc.setFillColor(240, 253, 244); // Light Green
    doc.setDrawColor(187, 247, 208); // Green border
  } else if (isRevoked) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
  } else {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
  }

  doc.setLineWidth(0.5);
  doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, "FD");

  // Status icon/text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  if (isActive) {
    doc.setTextColor(0, 132, 61); // Green
    doc.text("OFFICIAL VALID & ACTIVE CHAPTER CREDENTIAL", marginX + 5, currentY + 6);
  } else if (isRevoked) {
    doc.setTextColor(186, 12, 47);
    doc.text("CREDENTIAL STATUS: REVOKED", marginX + 5, currentY + 6);
  } else {
    doc.setTextColor(232, 119, 34);
    doc.text("CREDENTIAL STATUS: REPLACED / SUPERSEDED", marginX + 5, currentY + 6);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 105, 115);
  doc.text(
    "Verified in real-time against the IEEE CS UCET-IUB official certificate registry database.",
    marginX + 5,
    currentY + 10.5
  );

  // Status Pill on right
  const statusLabel = isActive ? "VALID RECORD" : cert.status;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(statusLabel, pageWidth - marginX - 5, currentY + 8, { align: "right" });

  currentY += 18;

  // Helper function to draw clean labeled field boxes
  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 40, 85);
    doc.text(title.toUpperCase(), marginX, yPos);

    doc.setDrawColor(255, 163, 0); // Gold accent
    doc.setLineWidth(0.8);
    doc.line(marginX, yPos + 1.5, marginX + 28, yPos + 1.5);

    doc.setDrawColor(230, 235, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX + 28, yPos + 1.5, pageWidth - marginX, yPos + 1.5);

    return yPos + 6;
  };

  // 4. Section: Credential Identifiers
  currentY = drawSectionHeader("1. Credential Identifiers & Verification Parameters", currentY);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 18, 1.5, 1.5, "FD");

  // Col 1: Code
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text("VERIFICATION CODE", marginX + 4, currentY + 5);

  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 40, 85);
  doc.text(cert.code, marginX + 4, currentY + 11);

  // Col 2: Date of Issuance
  const col2X = marginX + 65;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text("DATE OF ISSUANCE", col2X, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 40, 50);
  doc.text(formatPKTDateOnly(cert.issueDate), col2X, currentY + 11);

  // Col 3: Issuance Source
  const col3X = marginX + 120;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text("AUTHENTICATION SOURCE", col3X, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 40, 50);
  const sourceLabel =
    cert.source === "UPLOAD_REGISTRY"
      ? "Official Batch Registry"
      : cert.source === "IN_SITE_GENERATED"
      ? "In-Site Generated System Verification"
      : "Legacy Chapter Registry";
  doc.text(sourceLabel, col3X, currentY + 11);

  currentY += 22;

  // 5. Section: Certified Recipient Profile
  const recipientSectionTitle = cert.teamName ? "2. Certified Team Profile" : "2. Certified Recipient & Academic Profile";
  currentY = drawSectionHeader(recipientSectionTitle, currentY);

  const recipientCardHeight = cert.teamName ? 20 : 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, recipientCardHeight, 1.5, 1.5, "FD");

  // Recipient / Presented to
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text(cert.teamName ? "CERTIFIED RECIPIENT ENTITY" : "CERTIFIED RECIPIENT NAME", marginX + 4, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 40, 85);
  const recipientTitle = cert.teamName
    ? `TEAM ${cert.teamName.toUpperCase()}`
    : cert.recipientName;
  doc.text(recipientTitle, marginX + 4, currentY + 11);

  // Roll Number
  const rollY = currentY + 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 95, 105);
  doc.text(
    `Roll Number: ${cert.recipientRollNumber || "Not recorded in this credential"}`,
    marginX + 4,
    rollY
  );

  // Email (Right side)
  doc.text(
    `Email: ${cert.recipientEmail || "Not recorded in this credential"}`,
    col2X,
    rollY
  );

  // Academic Department / Affiliation (Far Right) - Only for individual participant certificates
  if (!cert.teamName) {
    const affiliation = cert.semester
      ? `${cert.semester} Semester, ${cert.department || "Department of Computer Science & IT / UCET"}`
      : (cert.department || "Department of Computer Science & IT / UCET");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 110, 120);
    doc.text("ACADEMIC AFFILIATION", col2X, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(40, 45, 55);
    const splitAffil = doc.splitTextToSize(affiliation, contentWidth - 65 - 4);
    doc.text(splitAffil, col2X, currentY + 10);
  }

  currentY += recipientCardHeight + 4;

  // 6. Section: Team & Technical Project Details (Only if teamName or projectTitle exists)
  if (cert.teamName || cert.projectTitle) {
    currentY = drawSectionHeader("3. Technical Project & Team Members", currentY);

    const membersBullet = formatTeamMembersBullets(cert.teamMembers || [cert.recipientName]);
    const membersText = membersBullet || cert.recipientName;

    doc.setFillColor(239, 246, 255); // Soft blue tint #EFF6FF
    doc.setDrawColor(191, 219, 254); // Blue border
    doc.roundedRect(marginX, currentY, contentWidth, 26, 1.5, 1.5, "FD");

    // Project Title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 98, 155);
    doc.text("IN RECOGNITION OF TECHNICAL PROJECT", marginX + 4, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 40, 85);
    doc.text(`"${cert.projectTitle || "Technical Project Demonstration"}"`, marginX + 4, currentY + 10.5);

    // Team Members & Contributors
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // Amber
    doc.text("TEAM MEMBERS & CONTRIBUTORS", marginX + 4, currentY + 16.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 25, 35);
    doc.text(membersText, marginX + 4, currentY + 21.5);

    currentY += 30;
  }

  // 7. Section: Event & Program Recognition
  const eventSectionTitle = cert.teamName || cert.projectTitle ? "4. Event & Program Details" : "3. Event & Program Details";
  currentY = drawSectionHeader(eventSectionTitle, currentY);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 20, 1.5, 1.5, "FD");

  // Event Title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text("EVENT / PROGRAM", marginX + 4, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 40, 85);
  doc.text(cert.eventTitle, marginX + 4, currentY + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 85, 95);
  doc.text(`Conducted on: ${formatPKTDateOnly(cert.activityDate)}`, marginX + 4, currentY + 16);

  // Recognition Type
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text("RECOGNITION LEVEL", col2X, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 98, 155);
  doc.text(cert.certificateType, col2X, currentY + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 85, 95);
  doc.text(CHAPTER_INFO.fullName, col2X, currentY + 16);

  currentY += 24;

  // 8. Section: Official Issuer Statement
  const issuerSectionTitle = cert.teamName || cert.projectTitle ? "5. Official Issuer Statement" : "4. Official Issuer Statement";
  currentY = drawSectionHeader(issuerSectionTitle, currentY);

  const issuerStatement = cert.issuerStatement || CHAPTER_INFO.issuerStatementDefault;
  const splitStatement = doc.splitTextToSize(`"${issuerStatement}"`, contentWidth - 10);
  const statementBoxHeight = Math.max(16, splitStatement.length * 4.2 + 7);

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(marginX, currentY, contentWidth, statementBoxHeight, 1.5, 1.5, "FD");

  // Accent vertical line inside
  doc.setFillColor(0, 98, 155);
  doc.rect(marginX, currentY, 2.5, statementBoxHeight, "F");

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(40, 45, 50);
  doc.text(splitStatement, marginX + 6, currentY + 5.5);

  currentY += statementBoxHeight + 4;

  // 9. Section: Verification Cross-Check & Real Scannable QR Code
  const qrSectionTitle = cert.teamName || cert.projectTitle ? "6. Real-Time Verification QR & Signatory Attestation" : "5. Real-Time Verification QR & Signatory Attestation";
  currentY = drawSectionHeader(qrSectionTitle, currentY);

  const verifyUrl = `https://ieeecsiub.vercel.app/verify/${cert.code}`;

  // Embed sharp QR code
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 160,
      color: { dark: "#002855", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
    doc.addImage(qrDataUrl, "PNG", marginX + 2, currentY + 1, 26, 26);
  } catch (err) {
    console.error("QR Code generation error:", err);
  }

  // QR Instruction Text
  const qrTextX = marginX + 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 40, 85);
  doc.text("Official Real-Time Verification Instructions", qrTextX, currentY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(70, 75, 85);
  doc.text("Scan the QR code with any smartphone camera or navigate to:", qrTextX, currentY + 9.5);

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 98, 155);
  doc.text(verifyUrl, qrTextX, currentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 115, 125);
  const crossCheckText =
    "Cross-Check Rule: The recipient name, team roster, event title, and issuance date printed on this document must match the physical certificate and the online verification page exactly.";
  const splitCrossCheck = doc.splitTextToSize(crossCheckText, contentWidth - 34 - 55);
  doc.text(splitCrossCheck, qrTextX, currentY + 18.5);

  // Signatory Box on Right side
  const sigX = pageWidth - marginX - 48;
  doc.setDrawColor(0, 40, 85);
  doc.setLineWidth(0.4);
  doc.line(sigX, currentY + 17, sigX + 46, currentY + 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 40, 85);
  doc.text(cert.approverName || "Muhammad Roshan Ashraf", sigX + 23, currentY + 21, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(90, 95, 105);
  doc.text("Chapter Chair", sigX + 23, currentY + 24.5, { align: "center" });
  doc.text("IEEE CS SBC UCET - IUB", sigX + 23, currentY + 28, { align: "center" });

  // 10. Official Footer (pinned to bottom)
  const footerY = pageHeight - 12;
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY, pageWidth - marginX, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(130, 135, 145);
  doc.text(
    `Official Verification Summary generated on ${new Date().toUTCString()} • Cryptographic Code: ${cert.code}`,
    marginX,
    footerY + 4
  );
  doc.text(
    "IEEE Computer Society Student Branch Chapter, UCET - The Islamia University of Bahawalpur",
    pageWidth - marginX,
    footerY + 4,
    { align: "right" }
  );

  doc.setFillColor(0, 40, 85);
  doc.rect(0, pageHeight - 3, pageWidth, 3, "F");

  return doc;
}

