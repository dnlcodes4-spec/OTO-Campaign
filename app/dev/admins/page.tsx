import { notFound } from "next/navigation";
import { DevAdminSetup } from "./DevAdminSetup";

export default function DevAdminsPage() {
  if (process.env.ADMIN_SETUP_ENABLED !== "true") {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-surface px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Admin setup</h1>
      <DevAdminSetup />
    </main>
  );
}
