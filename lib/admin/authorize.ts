import { timingSafeEqual } from "node:crypto";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAuthorization =
  | { authorized: true; actingAdminId: string | null }
  | { authorized: false };

// Performs constant-time comparison of two strings to prevent timing attacks
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function isOtoAdmin(userId: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("oto_admins")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (error) return false;
    return data !== null;
  } catch (error) {
    // A malformed Supabase client (e.g. a missing env var) throws during
    // construction rather than returning a query error. This function
    // gates admin access, so it must fail closed (deny) rather than let
    // the exception propagate into its callers (middleware, layouts).
    console.error("isOtoAdmin check failed:", error);
    return false;
  }
}

export async function authorizeAdminRequest(request: Request): Promise<AdminAuthorization> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && (await isOtoAdmin(user.id))) {
      return { authorized: true, actingAdminId: user.id };
    }
  } catch (error) {
    // Same fail-closed reasoning as isOtoAdmin: swallow the crash here and
    // fall through to the setup-key check below, rather than letting an
    // unhandled exception reach the API route caller as a raw 500.
    console.error("authorizeAdminRequest session check failed:", error);
  }

  if (process.env.ADMIN_SETUP_ENABLED === "true") {
    const providedKey = request.headers.get("x-admin-setup-key");
    const expectedKey = process.env.ADMIN_SETUP_KEY;
    if (providedKey && expectedKey && safeEqual(providedKey, expectedKey)) {
      return { authorized: true, actingAdminId: null };
    }
  }

  return { authorized: false };
}
