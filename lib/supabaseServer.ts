import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseServer: SupabaseClient | null = null;

export function getSupabaseServer() {
  if (supabaseServer) {
    return supabaseServer;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);
  return supabaseServer;
}
