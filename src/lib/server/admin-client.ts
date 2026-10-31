import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Administrative server-only Supabase client with service-role permissions.
 * Never import or expose to browser client code.
 */
export function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gbuafbcebcbwzvefqhcr.supabase.co";

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is missing on server.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

