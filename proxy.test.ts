import { expect, test } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function request(pathname: string) {
  return new NextRequest(new URL(pathname, "https://otosenate2027.com"));
}

function nonceFrom(csp: string) {
  return /'nonce-([^']+)'/.exec(csp)?.[1];
}

test("sets a Content-Security-Policy carrying a nonce", async () => {
  const response = await proxy(request("/"));
  const csp = response.headers.get("Content-Security-Policy");

  expect(csp).not.toBeNull();
  expect(nonceFrom(csp!)).toBeTruthy();
});

test("never falls back to 'unsafe-inline' for scripts — the whole point of the nonce", async () => {
  const response = await proxy(request("/"));
  const csp = response.headers.get("Content-Security-Policy")!;
  const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src"));

  expect(scriptSrc).not.toContain("unsafe-inline");
  expect(scriptSrc).toContain("'strict-dynamic'");
});

test("public pages get a locked-down connect-src with no Supabase/Cloudinary access", async () => {
  const response = await proxy(request("/"));
  const csp = response.headers.get("Content-Security-Policy")!;
  const connectSrc = csp.split(";").find((d) => d.trim().startsWith("connect-src"))!;

  expect(connectSrc).toContain("'self'");
  expect(connectSrc).not.toContain("supabase.co");
  expect(connectSrc).not.toContain("cloudinary.com");
});

test("admin pages get connect-src access to Supabase and Cloudinary's API", async () => {
  // /admin itself redirects to /admin/login when unauthenticated (no
  // session cookie in this test), and redirects carry no CSP of their
  // own — the browser just follows them to a URL that gets its own
  // correct one. /admin/login returns its response directly when
  // unauthenticated, so it's the stable path to assert the admin CSP on.
  const response = await proxy(request("/admin/login"));
  const csp = response.headers.get("Content-Security-Policy")!;
  const connectSrc = csp.split(";").find((d) => d.trim().startsWith("connect-src"))!;

  expect(connectSrc).toContain("supabase.co");
  expect(connectSrc).toContain("https://api.cloudinary.com");
});

test("two different requests get two different nonces", async () => {
  const [a, b] = await Promise.all([proxy(request("/")), proxy(request("/"))]);
  const nonceA = nonceFrom(a.headers.get("Content-Security-Policy")!);
  const nonceB = nonceFrom(b.headers.get("Content-Security-Policy")!);
  expect(nonceA).not.toBe(nonceB);
});
