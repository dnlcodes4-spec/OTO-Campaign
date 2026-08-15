import { beforeEach, expect, test, vi } from "vitest";

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));

const isOtoAdminMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  isOtoAdmin: (id: string) => isOtoAdminMock(id),
}));

import AdminLayout from "./layout";

beforeEach(() => {
  getUserMock.mockReset();
  isOtoAdminMock.mockReset();
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
