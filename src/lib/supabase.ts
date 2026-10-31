import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url: string;
  source: "ENV" | "LOCAL_STORAGE" | "SERVER_RUNTIME" | "NONE";
  error?: string;
  tableCounts?: {
    events?: number;
    teamMembers?: number;
    certificates?: number;
    registrations?: number;
    templates?: number;
  };
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = "";
let cachedKey = "";

// Helper to get active credentials safely (server-side & client-side)
export function getActiveSupabaseCredentials(): { url: string; key: string; source: "ENV" | "LOCAL_STORAGE" | "NONE" } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  if (envUrl && envKey && !envUrl.includes("your-supabase-url")) {
    return { url: envUrl, key: envKey, source: "ENV" };
  }

  if (typeof window !== "undefined") {
    try {
      const storedUrl = localStorage.getItem("ieee_supabase_url")?.trim() || "";
      const storedKey = localStorage.getItem("ieee_supabase_key")?.trim() || "";
      if (storedUrl && storedKey && !storedUrl.includes("your-supabase-url")) {
        return { url: storedUrl, key: storedKey, source: "LOCAL_STORAGE" };
      }
    } catch { }
  }

  return { url: "", key: "", source: "NONE" };
}

// Dynamic getter that ensures we always have the active Supabase client instance
export function getSupabase(): SupabaseClient | null {
  const { url, key } = getActiveSupabaseCredentials();
  if (url && key && url.startsWith("http")) {
    if (cachedClient && cachedUrl === url && cachedKey === key) {
      return cachedClient;
    }
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      cachedUrl = url;
      cachedKey = key;
      return cachedClient;
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      return null;
    }
  }
  return null;
}

// Backward-compatible createSupabaseInstance & singleton
export function createSupabaseInstance(): SupabaseClient | null {
  return getSupabase();
}

export let supabase: SupabaseClient | null = getSupabase();

export function refreshSupabaseClient(): SupabaseClient | null {
  cachedClient = null;
  cachedUrl = "";
  cachedKey = "";
  supabase = getSupabase();
  return supabase;
}

export const isSupabaseConfigured: boolean = Boolean(
  getActiveSupabaseCredentials().url && getActiveSupabaseCredentials().key
);

// Auto-sync with server configuration route on mount
export async function ensureSupabaseConnection(): Promise<SupabaseClient | null> {
  const current = getSupabase();
  if (current) return current;

  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/database/config");
      if (res.ok) {
        const data = await res.json();
        if (data.isConfigured && data.url && data.key) {
          localStorage.setItem("ieee_supabase_url", data.url);
          localStorage.setItem("ieee_supabase_key", data.key);
          return refreshSupabaseClient();
        }
      }
    } catch {}
  }
  return null;
}

// Save credentials from Admin Console (saves locally & syncs to server)
export function saveDynamicSupabaseCredentials(url: string, key: string): { success: boolean; client: SupabaseClient | null } {
  if (typeof window !== "undefined") {
    localStorage.setItem("ieee_supabase_url", url.trim());
    localStorage.setItem("ieee_supabase_key", key.trim());

    // Sync to server route in background so public visitors also connect
    fetch("/api/database/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), key: key.trim() }),
    }).catch(() => {});
  }
  const newClient = refreshSupabaseClient();
  return { success: Boolean(newClient), client: newClient };
}

// Clear credentials
export function clearDynamicSupabaseCredentials(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ieee_supabase_url");
    localStorage.removeItem("ieee_supabase_key");

    fetch("/api/database/config", {
      method: "DELETE",
    }).catch(() => {});
  }
  refreshSupabaseClient();
}

// Test live database connectivity and fetch table stats
export async function testSupabaseConnection(): Promise<SupabaseConfigStatus> {
  const creds = getActiveSupabaseCredentials();
  if (!creds.url || !creds.key) {
    // Try server runtime config
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/database/config");
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.isConfigured && cfg.url && cfg.key) {
            localStorage.setItem("ieee_supabase_url", cfg.url);
            localStorage.setItem("ieee_supabase_key", cfg.key);
            creds.url = cfg.url;
            creds.key = cfg.key;
            creds.source = "SERVER_RUNTIME" as any;
            refreshSupabaseClient();
          }
        }
      } catch {}
    }
  }

  if (!creds.url || !creds.key) {
    return {
      isConfigured: false,
      isConnected: false,
      url: "",
      source: "NONE",
      error: "Supabase URL and Anon Key are missing. Provide credentials in .env.local or enter them in the Admin Database settings.",
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      isConfigured: true,
      isConnected: false,
      url: creds.url,
      source: creds.source,
      error: "Could not create Supabase client. Please check the URL format.",
    };
  }

  try {
    // Test events query
    const { count: eventsCount, error: eventsError } = await client
      .from("events")
      .select("*", { count: "exact", head: true });

    if (eventsError) {
      return {
        isConfigured: true,
        isConnected: false,
        url: creds.url,
        source: creds.source,
        error: `Database connected, but table 'events' returned error: ${eventsError.message}. Make sure you have executed supabase/schema.sql in the Supabase SQL Editor.`,
      };
    }

    const [teamRes, certsRes, regRes, tplRes] = await Promise.allSettled([
      client.from("team_members").select("*", { count: "exact", head: true }),
      client.from("certificates").select("*", { count: "exact", head: true }),
      client.from("registrations").select("*", { count: "exact", head: true }),
      client.from("certificate_templates").select("*", { count: "exact", head: true }),
    ]);

    const tableCounts = {
      events: eventsCount ?? 0,
      teamMembers: teamRes.status === "fulfilled" ? teamRes.value.count ?? 0 : 0,
      certificates: certsRes.status === "fulfilled" ? certsRes.value.count ?? 0 : 0,
      registrations: regRes.status === "fulfilled" ? regRes.value.count ?? 0 : 0,
      templates: tplRes.status === "fulfilled" ? tplRes.value.count ?? 0 : 0,
    };

    return {
      isConfigured: true,
      isConnected: true,
      url: creds.url,
      source: creds.source,
      tableCounts,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      url: creds.url,
      source: creds.source,
      error: err.message || "Failed to query Supabase tables. Check network connection and RLS policies.",
    };
  }
}
