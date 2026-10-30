import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { CertificateRecord } from "@/types";
import { CHAPTER_INFO } from "./constants";
import { formatPKTDateOnly } from "./sha256";

export async function generateCertificatePdf(cert: CertificateRecord): Promise<jsPDF> {
  // Landscape A4: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth(); // 297
  const height = doc.internal.pageSize.getHeight(); // 210

  // 1. Double Border Frame (IEEE Navy #002855 & IEEE CS Orange #FFA300)
  doc.setDrawColor(0, 40, 85); // Navy
  doc.setLineWidth(3);
  doc.rect(8, 8, width - 16, height - 16);

  doc.setDrawColor(255, 163, 0); // Orange
  doc.setLineWidth(1);
  doc.rect(12, 12, width - 24, height - 24);

  // Decorative corner accents
  doc.setFillColor(0, 98, 155); // IEEE Blue
  doc.rect(8, 8, 10, 3, "F");
  doc.rect(8, 8, 3, 10, "F");
  doc.rect(width - 18, 8, 10, 3, "F");
  doc.rect(width - 11, 8, 3, 10, "F");
  doc.rect(8, height - 11, 10, 3, "F");
  doc.rect(8, height - 18, 3, 10, "F");
  doc.rect(width - 18, height - 11, 10, 3, "F");
  doc.rect(width - 11, height - 18, 3, 10, "F");

  // 2. Header: IEEE COMPUTER SOCIETY
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 40, 85); // Navy
  doc.text("IEEE COMPUTER SOCIETY", width / 2, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 98, 155); // IEEE Blue
  doc.text("STUDENT BRANCH CHAPTER", width / 2, 33, { align: "center" });
  doc.text(
    "University College of Engineering & Technology • The Islamia University of Bahawalpur",
    width / 2,
    38,
    { align: "center" }
  );

  // Thin separator rule
  doc.setDrawColor(255, 163, 0); // Orange
  doc.setLineWidth(0.8);
  doc.line(width / 2 - 50, 42, width / 2 + 50, 42);

  // 3. Certificate Type Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 40, 85);
  doc.text(cert.certificateType.toUpperCase(), width / 2, 54, { align: "center" });

  // 4. "This is proudly presented to"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(117, 120, 123); // Cool Gray
  doc.text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", width / 2, 65, { align: "center" });

  // 5. Recipient Name (Prominent & Styled)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(0, 98, 155); // IEEE Blue
  doc.text(cert.recipientName, width / 2, 78, { align: "center" });

  // Underline beneath name
  doc.setDrawColor(0, 98, 155);
  doc.setLineWidth(0.5);
  const nameWidth = doc.getTextWidth(cert.recipientName);
  doc.line(width / 2 - nameWidth / 2 - 10, 82, width / 2 + nameWidth / 2 + 10, 82);

  // 6. Body Paragraph
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const bodyText = `For exemplary dedication and successful participation in "${cert.eventTitle}", conducted by the IEEE Computer Society Student Branch Chapter at UCET-IUB on ${formatPKTDateOnly(cert.activityDate)}.`;
  
  const splitBody = doc.splitTextToSize(bodyText, width - 80);
  doc.text(splitBody, width / 2, 92, { align: "center" });

  // 7. QR Code Generation for Verification
  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://cs.ucet-iub.ieee.org"}/verify/${cert.code}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: { dark: "#002855", light: "#FFFFFF" },
    });
    // Place QR code in center-bottom
    doc.addImage(qrDataUrl, "PNG", width / 2 - 14, 122, 28, 28);
  } catch (err) {
    console.error("QR embedding failed", err);
  }

  // Verification Code below QR
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 40, 85);
  doc.text(`Code: ${cert.code}`, width / 2, 154, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(117, 120, 123);
  doc.text("Scan QR code or visit website to verify record authenticity", width / 2, 158, { align: "center" });

  // 8. Signatures Block (Left: Chapter Chair, Right: Faculty Advisor)
  // Left: Chapter Chair
  const leftX = 55;
  doc.setDrawColor(0, 40, 85);
  doc.setLineWidth(0.4);
  doc.line(leftX - 30, 160, leftX + 30, 160);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 40, 85);
  doc.text("Muhammad Roshan Ashraf", leftX, 165, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(117, 120, 123);
  doc.text("Chapter Chair", leftX, 169, { align: "center" });
  doc.text("IEEE CS UCET-IUB", leftX, 173, { align: "center" });

  // Right: Faculty Advisor
  const rightX = width - 55;
  doc.setDrawColor(0, 40, 85);
  doc.setLineWidth(0.4);
  doc.line(rightX - 30, 160, rightX + 30, 160);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 40, 85);
  doc.text(cert.approverName, rightX, 165, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(117, 120, 123);
  doc.text(cert.approverRole, rightX, 169, { align: "center" });
  doc.text("UCET, IUB", rightX, 173, { align: "center" });

  // 9. Official Credential Disclaimer Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(117, 120, 123);
  doc.text(
    `${CHAPTER_INFO.issuerStatementDefault} • Official record maintained on ${verifyUrl}`,
    width / 2,
    192,
    { align: "center" }
  );

  return doc;
}
