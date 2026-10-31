import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url: string;
  source: "ENV" | "PROD_DEFAULT" | "NONE";
  error?: string;
  tableCounts?: {
    events?: number;
    teamMembers?: number;
    certificates?: number;
    registrations?: number;
    templates?: number;
    eventTeams?: number;
  };
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = "";
let cachedKey = "";

// IEEE CS UCET-IUB Official Production Database Credentials
const DEFAULT_SUPABASE_URL = "https://gbuafbcebcbwzvefqhcr.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWFmYmNlYmNid3p2ZWZxaGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNjUxNjgsImV4cCI6MjEwODk0MTE2OH0.j1tB4mcsDnyRUYo36EQk90fz-xR0VT55L5kqomLgeDU";

/**
 * Returns active database credentials strictly from environment variables or production defaults.
 * No browser localStorage override (Phase 0 security hardening).
 */
export function getActiveSupabaseCredentials(): { url: string; key: string; source: "ENV" | "PROD_DEFAULT" | "NONE" } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  if (envUrl && envKey && !envUrl.includes("your-supabase-url")) {
    return { url: envUrl, key: envKey, source: "ENV" };
  }

  // Built-in production database fallback
  if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY, source: "PROD_DEFAULT" };
  }

  return { url: "", key: "", source: "NONE" };
}

/**
 * Dynamic getter that ensures we always have the active Supabase client instance
 */
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

export async function ensureSupabaseConnection(): Promise<SupabaseClient | null> {
  return getSupabase();
}

/**
 * Test live database connectivity and fetch table stats
 */
export async function testSupabaseConnection(): Promise<SupabaseConfigStatus> {
  const creds = getActiveSupabaseCredentials();

  if (!creds.url || !creds.key) {
    return {
      isConfigured: false,
      isConnected: false,
      url: "",
      source: "NONE",
      error: "Supabase URL and Anon Key are missing. Provide credentials in environment variables.",
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
        error: `Database connected, but table 'events' returned error: ${eventsError.message}`,
      };
    }

    const [teamRes, certsRes, regRes, tplRes, teamEvRes] = await Promise.allSettled([
      client.from("team_members").select("*", { count: "exact", head: true }),
      client.from("certificates").select("*", { count: "exact", head: true }),
      client.from("registrations").select("*", { count: "exact", head: true }),
      client.from("certificate_templates").select("*", { count: "exact", head: true }),
      client.from("event_teams").select("*", { count: "exact", head: true }),
    ]);

    const tableCounts = {
      events: eventsCount ?? 0,
      teamMembers: teamRes.status === "fulfilled" ? teamRes.value.count ?? 0 : 0,
      certificates: certsRes.status === "fulfilled" ? certsRes.value.count ?? 0 : 0,
      registrations: regRes.status === "fulfilled" ? regRes.value.count ?? 0 : 0,
      templates: tplRes.status === "fulfilled" ? tplRes.value.count ?? 0 : 0,
      eventTeams: teamEvRes.status === "fulfilled" ? teamEvRes.value.count ?? 0 : 0,
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
