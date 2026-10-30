/**
 * Computes SHA-256 hexadecimal string from ArrayBuffer or File
 */
export async function computeFileSha256(file: File | ArrayBuffer): Promise<string> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Format PKT (Pakistan Standard Time, UTC+5) timestamp cleanly
 */
export function formatPKTDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date) + " PKT";
  } catch {
    return isoString;
  }
}

export function formatPKTDateOnly(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return isoString;
  }
}
