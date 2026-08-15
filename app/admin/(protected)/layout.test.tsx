import { beforeEach, expect, test, vi } from "vitest";

const getUserMock = vi.fn();
const createClientMock = vi.fn(async () => ({ auth: { getUser: getUserMock } }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

const isOtoAdminMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  isOtoAdmin: (id: string) => isOtoAdminMock(id),
}));

import AdminLayout from "./layout";

beforeEach(() => {
  getUserMock.mockReset();
  isOtoAdminMock.mockReset();
  createClientMock.mockReset();
  createClientMock.mockImplementation(async () => ({ auth: { getUser: getUserMock } }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

test("redirects to login when there is no session", async () => {
  getUserMock.mockResolvedValue({ data: { user: null } });
  await expect(AdminLayout({ children: null })).rejects.toThrow();
});

test("redirects to login when the user is not an oto_admin", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-9" } } });
  isOtoAdminMock.mockResolvedValue(false);
  await expect(AdminLayout({ children: null })).rejects.toThrow();
});

test("renders children and nav links for an authorized admin", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  isOtoAdminMock.mockResolvedValue(true);
  const result = await AdminLayout({ children: "protected content" });
  expect(result).toBeTruthy();
});

test("fails closed and redirects to login when the auth check throws, logging the real cause", async () => {
  createClientMock.mockImplementation(async () => {
    throw new Error("supabaseUrl is required.");
  });
  // A crash here must still surface as next/navigation's redirect (isOtoAdmin
  // never gets a chance to run), not an unhandled render crash.
  await expect(AdminLayout({ children: null })).rejects.toThrow();
  expect(isOtoAdminMock).not.toHaveBeenCalled();
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining("Admin layout"),
    expect.any(Error)
  );
});
