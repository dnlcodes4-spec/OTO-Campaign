import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
const createServerClientMock = vi.fn(() => ({ auth: { getUser: getUserMock } }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => createServerClientMock(),
}));

const isOtoAdminMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  isOtoAdmin: (id: string) => isOtoAdminMock(id),
}));

import { proxy } from "./proxy";

beforeEach(() => {
  getUserMock.mockReset();
  isOtoAdminMock.mockReset();
  createServerClientMock.mockReset();
  createServerClientMock.mockImplementation(() => ({ auth: { getUser: getUserMock } }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
});

test("redirects an unauthenticated visitor away from a protected admin route", async () => {
  getUserMock.mockResolvedValue({ data: { user: null } });
  const response = await proxy(new NextRequest("http://localhost/admin/admins"));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost/admin/login");
});

test("lets a logged-in oto_admin through to a protected route", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  isOtoAdminMock.mockResolvedValue(true);
  const response = await proxy(new NextRequest("http://localhost/admin/admins"));
  expect(response.status).toBe(200);
});

test("redirects a logged-in non-admin away from a protected route", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-9" } } });
  isOtoAdminMock.mockResolvedValue(false);
  const response = await proxy(new NextRequest("http://localhost/admin/admins"));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost/admin/login");
});

test("redirects an already-authorized admin away from the login page", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  isOtoAdminMock.mockResolvedValue(true);
  const response = await proxy(new NextRequest("http://localhost/admin/login"));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost/admin");
});

test("lets an unauthenticated visitor reach the login page", async () => {
  getUserMock.mockResolvedValue({ data: { user: null } });
  const response = await proxy(new NextRequest("http://localhost/admin/login"));
  expect(response.status).toBe(200);
});

test("does not touch requests outside /admin", async () => {
  const response = await proxy(new NextRequest("http://localhost/gallery"));
  expect(response.status).toBe(200);
  expect(getUserMock).not.toHaveBeenCalled();
});

test("fails closed and redirects to login when the auth check throws", async () => {
  createServerClientMock.mockImplementation(() => {
    throw new Error("supabaseUrl is required.");
  });
  const response = await proxy(new NextRequest("http://localhost/admin/admins"));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost/admin/login");
});

test("still serves the login page itself when the auth check throws", async () => {
  createServerClientMock.mockImplementation(() => {
    throw new Error("supabaseUrl is required.");
  });
  const response = await proxy(new NextRequest("http://localhost/admin/login"));
  expect(response.status).toBe(200);
});

test("lets a Next.js internal signal propagate instead of swallowing it", async () => {
  const signal = Object.assign(new Error("Dynamic server usage"), {
    digest: "DYNAMIC_SERVER_USAGE",
  });
  createServerClientMock.mockImplementation(() => {
    throw signal;
  });
  await expect(proxy(new NextRequest("http://localhost/admin/admins"))).rejects.toBe(signal);
});
