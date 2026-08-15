import { notFound } from "next/navigation";
import { DevAdminSetup } from "./DevAdminSetup";

/*
 * ADMIN_SETUP_ENABLED is a runtime env var: on the production host (Plesk)
 * it is set in a control panel long after `next build` has run. Without
 * this, the page reads no Request-time API, so Next prerenders it at build
 * time and freezes whatever the build-time env said - permanently 404 (or
 * permanently unlocked) no matter what the running server is configured
 * with. Since this page is the only way to create the first production
 * admin, it has to be evaluated per request.
 */
export const dynamic = "force-dynamic";

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
