import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url: string;
  source: "ENV" | "LOCAL_STORAGE" | "NONE";
  error?: string;
  tableCounts?: {
    events?: number;
    teamMembers?: number;
    certificates?: number;
    registrations?: number;
    templates?: number;
  };
}

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

// Create or return Supabase Client instance
export function createSupabaseInstance(): SupabaseClient | null {
  const { url, key } = getActiveSupabaseCredentials();
  if (url && key && url.startsWith("http")) {
    try {
      return createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      return null;
    }
  }
  return null;
}

export let supabase: SupabaseClient | null = createSupabaseInstance();

// Re-initialize supabase on demand (e.g. when credentials are saved in admin)
export function refreshSupabaseClient(): SupabaseClient | null {
  supabase = createSupabaseInstance();
  return supabase;
}

export const isSupabaseConfigured: boolean = Boolean(
  getActiveSupabaseCredentials().url && getActiveSupabaseCredentials().key
);

// Save credentials from Admin Console
export function saveDynamicSupabaseCredentials(url: string, key: string): { success: boolean; client: SupabaseClient | null } {
  if (typeof window !== "undefined") {
    localStorage.setItem("ieee_supabase_url", url.trim());
    localStorage.setItem("ieee_supabase_key", key.trim());
  }
  const newClient = refreshSupabaseClient();
  return { success: Boolean(newClient), client: newClient };
}

// Clear credentials
export function clearDynamicSupabaseCredentials(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ieee_supabase_url");
    localStorage.removeItem("ieee_supabase_key");
  }
  refreshSupabaseClient();
}

// Test live database connectivity and fetch table stats
export async function testSupabaseConnection(): Promise<SupabaseConfigStatus> {
  const creds = getActiveSupabaseCredentials();
  if (!creds.url || !creds.key) {
    return {
      isConfigured: false,
      isConnected: false,
      url: "",
      source: "NONE",
      error: "Supabase URL and Anon Key are missing. Provide credentials in .env.local or enter them in the Admin Database settings.",
    };
  }

  const client = createSupabaseInstance();
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
