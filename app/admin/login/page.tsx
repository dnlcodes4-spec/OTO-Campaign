import { connection } from "next/server";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

/*
 * Forces this route off static generation. Nonce-based CSP (see proxy.ts)
 * only reaches a page's own script tags when it's rendered per request —
 * a statically pre-rendered page has no request to draw a nonce from, so
 * its bundled hydration script would ship with none and get blocked by
 * the browser regardless of what CSP header proxy.ts sends alongside it.
 * Every other route in this app is already request-rendered; this was the
 * one exception (`export const dynamic = "force-dynamic"` did not take
 * effect on this route even after a clean rebuild — awaiting `connection`
 * is the mechanism Next's own CSP guide recommends instead, and it works
 * because it's a genuine runtime signal: the promise only resolves once an
 * actual request exists, so the page can't be pre-rendered at build time).
 */
export default async function AdminLoginPage() {
  await connection();
  return <AdminLoginForm />;
}
