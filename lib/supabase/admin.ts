import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/*
 * The URL comes from the shared SUPABASE_URL constant (safe fallback baked
 * in, see lib/supabase/env.ts) rather than reading
 * process.env.NEXT_PUBLIC_SUPABASE_URL directly, for the same reason every
 * other client in this app does: at least one production host in the wild
 * does not propagate custom env vars into the build the way it does the
 * runtime process. SUPABASE_SERVICE_ROLE_KEY has no safe fallback (it's a
 * secret) and is expected to throw here if genuinely absent; every caller
 * of createAdminClient() already fails closed around that.
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
