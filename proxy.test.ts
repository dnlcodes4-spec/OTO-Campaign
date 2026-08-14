import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: getUserMock } }),
}));

const isOtoAdminMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  isOtoAdmin: (id: string) => isOtoAdminMock(id),
}));

import { proxy } from "./proxy";

beforeEach(() => {
  getUserMock.mockReset();
  isOtoAdminMock.mockReset();
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
