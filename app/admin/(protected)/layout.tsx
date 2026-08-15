import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOtoAdmin } from "@/lib/admin/authorize";
import { SignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let authorized = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authorized = user !== null && (await isOtoAdmin(user.id));
  } catch (error) {
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
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <p className="font-display text-lg font-semibold text-ink">OTO Admin</p>
        <nav className="flex items-center gap-6 text-sm font-body">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/admins">Admins</Link>
          <Link href="/admin/gallery">Gallery</Link>
          <SignOutButton />
        </nav>
      </header>
      <main className="px-6 py-10">{children}</main>
    </div>
  );
}
