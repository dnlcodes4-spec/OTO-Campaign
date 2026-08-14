import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const eqMock = vi.fn();
const deleteMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ delete: deleteMock }));
const deleteUserMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: fromMock,
    auth: { admin: { deleteUser: deleteUserMock } },
  }),
}));

import { DELETE } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  eqMock.mockReset();
  deleteMock.mockClear();
  fromMock.mockClear();
  deleteUserMock.mockReset();
});

test("rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await DELETE(new Request("http://localhost/api/admin/admins/1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "1" }),
  });
  expect(response.status).toBe(401);
  expect(fromMock).not.toHaveBeenCalled();
});

test("deletes the oto_admins row and the auth user", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  eqMock.mockResolvedValue({ error: null });
  deleteUserMock.mockResolvedValue({ error: null });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(200);
  expect(fromMock).toHaveBeenCalledWith("oto_admins");
  expect(eqMock).toHaveBeenCalledWith("id", "target");
  expect(deleteUserMock).toHaveBeenCalledWith("target");
});

test("returns 500 if deleting the row fails, and does not delete the auth user", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  eqMock.mockResolvedValue({ error: new Error("row locked") });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(500);
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("returns 500 if deleting the auth user fails", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  eqMock.mockResolvedValue({ error: null });
  deleteUserMock.mockResolvedValue({ error: new Error("auth service down") });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(500);
});
