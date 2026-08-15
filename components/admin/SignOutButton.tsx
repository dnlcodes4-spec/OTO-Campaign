"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/*
 * The protected admin layout is a Server Component, so the sign-out control
 * has to be its own client island: signOut() clears the session cookie in
 * the browser, and the refresh() re-runs the server layout so the proxy
 * sends the now-anonymous visitor to the login page.
 */
export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className="text-sm text-brand-red underline">
      Sign out
    </button>
  );
}
