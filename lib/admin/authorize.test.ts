import { beforeEach, describe, expect, test, vi } from "vitest";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: getUserMock } }),
}));

import { authorizeAdminRequest, isOtoAdmin } from "./authorize";

beforeEach(() => {
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
  getUserMock.mockReset();
  delete process.env.ADMIN_SETUP_ENABLED;
  delete process.env.ADMIN_SETUP_KEY;
});

describe("isOtoAdmin", () => {
  test("returns true when the user id exists in oto_admins", async () => {
    maybeSingleMock.mockResolvedValue({ data: { id: "user-1" }, error: null });
    await expect(isOtoAdmin("user-1")).resolves.toBe(true);
    expect(fromMock).toHaveBeenCalledWith("oto_admins");
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
  });

  test("returns false when no matching row exists", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    await expect(isOtoAdmin("user-2")).resolves.toBe(false);
  });

  test("returns false on query error", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: new Error("boom") });
    await expect(isOtoAdmin("user-3")).resolves.toBe(false);
  });
});

describe("authorizeAdminRequest", () => {
  test("authorizes a logged-in oto_admin using their session", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingleMock.mockResolvedValue({ data: { id: "user-1" }, error: null });
    const result = await authorizeAdminRequest(new Request("http://localhost/api/admin/admins"));
    expect(result).toEqual({ authorized: true, actingAdminId: "user-1" });
  });

  test("rejects a logged-in user who is not an oto_admin, with setup disabled", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-9" } } });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const result = await authorizeAdminRequest(new Request("http://localhost/api/admin/admins"));
    expect(result).toEqual({ authorized: false });
  });

  test("authorizes an anonymous request carrying the correct setup key when setup is enabled", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    process.env.ADMIN_SETUP_ENABLED = "true";
    process.env.ADMIN_SETUP_KEY = "correct-key";
    const result = await authorizeAdminRequest(
      new Request("http://localhost/api/admin/admins", {
        headers: { "x-admin-setup-key": "correct-key" },
      })
    );
    expect(result).toEqual({ authorized: true, actingAdminId: null });
  });

  test("rejects an anonymous request with the wrong setup key", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    process.env.ADMIN_SETUP_ENABLED = "true";
    process.env.ADMIN_SETUP_KEY = "correct-key";
    const result = await authorizeAdminRequest(
      new Request("http://localhost/api/admin/admins", {
        headers: { "x-admin-setup-key": "wrong-key" },
      })
    );
    expect(result).toEqual({ authorized: false });
  });

  test("rejects an anonymous request when setup is not enabled", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const result = await authorizeAdminRequest(new Request("http://localhost/api/admin/admins"));
    expect(result).toEqual({ authorized: false });
  });
});
