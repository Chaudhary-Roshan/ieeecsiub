import QRCode from "qrcode";

const CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude I, O to prevent confusion

/**
 * Computes a weighted checksum character for code validation
 */
export function computeCheckChar(payload: string): string {
  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload[i].toUpperCase();
    const index = CHARS.indexOf(char);
    if (index !== -1) {
      sum = (sum + index * (i + 1)) % CHARS.length;
    }
  }
  return CHARS[sum];
}

/**
 * Generates an official chapter certificate code:
 * Format: CSIUB-26-XXXX-XXXX (where the last character is the checksum)
 */
export function generateCertificateCode(yearPrefix = "26"): string {
  // 7 random alphanumeric characters
  let randomPart = "";
  for (let i = 0; i < 7; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    randomPart += CHARS[randomIndex];
  }

  // Pre-formatted string without checksum: "CSIUB-26-" + randomPart (7 chars)
  const base = `CSIUB-${yearPrefix}-${randomPart}`;
  const checkChar = computeCheckChar(base);

  // Split into 4-char groups: 4 chars, then 3 chars + checkChar = 4 chars
  const part1 = randomPart.slice(0, 4);
  const part2 = randomPart.slice(4) + checkChar;

  return `CSIUB-${yearPrefix}-${part1}-${part2}`;
}

/**
 * Validates whether a certificate code has a valid format and checksum
 */
export function validateCertificateCode(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  const pattern = /^CSIUB-(\d{2})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;
  const match = clean.match(pattern);
  if (!match) return false;

  const year = match[1];
  const part1 = match[2];
  const part2 = match[3];

  const random7 = part1 + part2.slice(0, 3);
  const providedCheck = part2.slice(3);

  const base = `CSIUB-${year}-${random7}`;
  const expectedCheck = computeCheckChar(base);

  return providedCheck === expectedCheck;
}

/**
 * Generates a Data URL (base64 PNG) of the QR code for a given verification URL
 */
export async function generateQrPngDataUrl(verifyUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 400,
      color: {
        dark: "#002855", // Navy color for crisp IEEE brand look
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
    return "";
  }
}

/**
 * Generates an SVG string of the QR code for vector rendering
 */
export async function generateQrSvgString(verifyUrl: string): Promise<string> {
  try {
    return await QRCode.toString(verifyUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#002855",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("QR Code SVG generation error:", err);
    return "";
  }
}
