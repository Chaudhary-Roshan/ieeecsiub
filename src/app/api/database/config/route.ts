import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join("/tmp", "ieee_supabase_config.json");

function readTempConfig(): { url: string; key: string } {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch {}
  return { url: "", key: "" };
}

function writeTempConfig(url: string, key: string) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ url, key }), "utf-8");
  } catch {}
}

function deleteTempConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }
  } catch {}
}

export async function GET() {
  // Check process.env first
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  if (envUrl && envKey && !envUrl.includes("your-supabase-url")) {
    return NextResponse.json({
      isConfigured: true,
      url: envUrl,
      key: envKey,
      source: "ENV",
    });
  }

  // Check temp file fallback
  const temp = readTempConfig();
  if (temp.url && temp.key) {
    return NextResponse.json({
      isConfigured: true,
      url: temp.url,
      key: temp.key,
      source: "SERVER_RUNTIME",
    });
  }

  return NextResponse.json({
    isConfigured: false,
    url: "",
    key: "",
    source: "NONE",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, key } = body;

    if (!url || !key) {
      return NextResponse.json(
        { success: false, error: "Missing Supabase URL or Anon API Key." },
        { status: 400 }
      );
    }

    if (!url.startsWith("http")) {
      return NextResponse.json(
        { success: false, error: "Invalid URL format. Must start with https://" },
        { status: 400 }
      );
    }

    writeTempConfig(url.trim(), key.trim());

    return NextResponse.json({ success: true, message: "Database configuration updated." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save configuration." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  deleteTempConfig();
  return NextResponse.json({ success: true, message: "Database configuration cleared." });
}
