import { beforeEach, describe, expect, test, vi } from "vitest";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const createAdminClientMock = vi.fn(() => ({ from: fromMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

const getUserMock = vi.fn();
const createServerClientMock = vi.fn(async () => ({ auth: { getUser: getUserMock } }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createServerClientMock(),
}));

import { authorizeAdminRequest, isOtoAdmin } from "./authorize";

beforeEach(() => {
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
  createAdminClientMock.mockReset();
  createAdminClientMock.mockImplementation(() => ({ from: fromMock }));
  getUserMock.mockReset();
  createServerClientMock.mockReset();
  createServerClientMock.mockImplementation(async () => ({ auth: { getUser: getUserMock } }));
  vi.spyOn(console, "error").mockImplementation(() => {});
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

  test("fails closed (returns false) when the admin client throws instead of querying", async () => {
    createAdminClientMock.mockImplementation(() => {
      throw new Error("supabaseUrl is required.");
    });
    await expect(isOtoAdmin("user-4")).resolves.toBe(false);
  });

  test("lets a Next.js internal signal propagate instead of swallowing it", async () => {
    const signal = Object.assign(new Error("Dynamic server usage"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    createAdminClientMock.mockImplementation(() => {
      throw signal;
    });
    await expect(isOtoAdmin("user-5")).rejects.toBe(signal);
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

  test("rejects an anonymous request with a setup key of different length", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    process.env.ADMIN_SETUP_ENABLED = "true";
    process.env.ADMIN_SETUP_KEY = "correct-key";
    const result = await authorizeAdminRequest(
      new Request("http://localhost/api/admin/admins", {
        headers: { "x-admin-setup-key": "too-short" },
      })
    );
    expect(result).toEqual({ authorized: false });
  });

  test("rejects an anonymous request with a setup key of same length but different content", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    process.env.ADMIN_SETUP_ENABLED = "true";
    process.env.ADMIN_SETUP_KEY = "correct-key";
    const result = await authorizeAdminRequest(
      new Request("http://localhost/api/admin/admins", {
        headers: { "x-admin-setup-key": "wrong-key-x" },
      })
    );
    expect(result).toEqual({ authorized: false });
  });

  test("rejects an anonymous request when setup is not enabled", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const result = await authorizeAdminRequest(new Request("http://localhost/api/admin/admins"));
    expect(result).toEqual({ authorized: false });
  });

  test("fails closed but still honors the setup key when the session check throws", async () => {
    createServerClientMock.mockImplementation(async () => {
      throw new Error("supabaseUrl is required.");
    });
    process.env.ADMIN_SETUP_ENABLED = "true";
    process.env.ADMIN_SETUP_KEY = "correct-key";
    const result = await authorizeAdminRequest(
      new Request("http://localhost/api/admin/admins", {
        headers: { "x-admin-setup-key": "correct-key" },
      })
    );
    expect(result).toEqual({ authorized: true, actingAdminId: null });
  });

  test("rejects when the session check throws and setup is not enabled", async () => {
    createServerClientMock.mockImplementation(async () => {
      throw new Error("supabaseUrl is required.");
    });
    const result = await authorizeAdminRequest(new Request("http://localhost/api/admin/admins"));
    expect(result).toEqual({ authorized: false });
  });

  test("lets a Next.js internal signal propagate instead of swallowing it", async () => {
    const signal = Object.assign(new Error("Dynamic server usage"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    createServerClientMock.mockImplementation(async () => {
      throw signal;
    });
    await expect(
      authorizeAdminRequest(new Request("http://localhost/api/admin/admins"))
    ).rejects.toBe(signal);
  });
});
