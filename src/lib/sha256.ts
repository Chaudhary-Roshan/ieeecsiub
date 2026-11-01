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

/**
 * Converts a database UTC ISO string to "YYYY-MM-DDTHH:mm" in Pakistan Standard Time (UTC+5)
 * for use in <input type="datetime-local" />
 */
export function isoToPktInput(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    // Shift by +5 hours (PKT = UTC+5)
    const pktDate = new Date(date.getTime() + 5 * 60 * 60 * 1000);
    return pktDate.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

/**
 * Converts an <input type="datetime-local" /> value (e.g. "2026-11-05T10:00")
 * entered in Pakistan Standard Time (UTC+5) into an absolute UTC ISO string (e.g. "2026-11-05T05:00:00.000Z")
 */
export function pktInputToIso(pktInput?: string | null): string {
  if (!pktInput) return "";
  try {
    if (pktInput.includes("Z") || pktInput.includes("+")) {
      return new Date(pktInput).toISOString();
    }
    const normalized = pktInput.length === 16 ? `${pktInput}:00+05:00` : `${pktInput}+05:00`;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) {
      return new Date(pktInput).toISOString();
    }
    return date.toISOString();
  } catch {
    return "";
  }
}
