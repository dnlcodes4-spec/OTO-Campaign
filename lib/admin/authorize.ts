import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAuthorization =
  | { authorized: true; actingAdminId: string | null }
  | { authorized: false };

export async function isOtoAdmin(userId: string): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_admins")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) return false;
  return data !== null;
}

export async function authorizeAdminRequest(request: Request): Promise<AdminAuthorization> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && (await isOtoAdmin(user.id))) {
    return { authorized: true, actingAdminId: user.id };
  }

  if (process.env.ADMIN_SETUP_ENABLED === "true") {
    const providedKey = request.headers.get("x-admin-setup-key");
    const expectedKey = process.env.ADMIN_SETUP_KEY;
    if (providedKey && expectedKey && providedKey === expectedKey) {
      return { authorized: true, actingAdminId: null };
    }
  }

  return { authorized: false };
}
