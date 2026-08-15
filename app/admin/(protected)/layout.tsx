import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOtoAdmin } from "@/lib/admin/authorize";
import { isNextInternalSignal } from "@/lib/next-internal-errors";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/admin/ToastProvider";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let authorized = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authorized = user !== null && (await isOtoAdmin(user.id));
  } catch (error) {
    if (isNextInternalSignal(error)) throw error;
    // A malformed Supabase client (e.g. a missing env var) throws during
    // construction. This layout wraps the entire admin console, so a crash
    // here would take down every /admin/* page render, not just one. Fail
    // closed and redirect instead of letting it surface as the generic
    // production error page.
    console.error("Admin layout auth check failed:", error);
    authorized = false;
  }

  if (!authorized) {
    redirect("/admin/login");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface">
        <header className="border-b border-ink/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <p className="font-display text-lg font-semibold text-ink">OTO Admin</p>
            <AdminNav />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </div>
    </ToastProvider>
  );
}
