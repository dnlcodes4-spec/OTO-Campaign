import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOtoAdmin } from "@/lib/admin/authorize";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isOtoAdmin(user.id))) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <p className="font-display text-lg font-semibold text-ink">OTO Admin</p>
        <nav className="flex gap-6 text-sm font-body">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/admins">Admins</Link>
        </nav>
      </header>
      <main className="px-6 py-10">{children}</main>
    </div>
  );
}
