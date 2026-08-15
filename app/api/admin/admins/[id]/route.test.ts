import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const deleteSelectMock = vi.fn();
const eqMock = vi.fn(() => ({ select: deleteSelectMock }));
const deleteMock = vi.fn(() => ({ eq: eqMock }));
const selectMock = vi.fn();
const fromMock = vi.fn(() => ({ select: selectMock, delete: deleteMock }));
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
  deleteSelectMock.mockReset();
  eqMock.mockClear();
  deleteMock.mockClear();
  selectMock.mockReset();
  // Default to a roster with room to spare so the last-admin guard is out of
  // the way; the guard's own tests override this.
  selectMock.mockResolvedValue({ count: 2, error: null });
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
  deleteSelectMock.mockResolvedValue({ data: [{ id: "target" }], error: null });
  deleteUserMock.mockResolvedValue({ error: null });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(200);
  expect(fromMock).toHaveBeenCalledWith("oto_admins");
  expect(selectMock).toHaveBeenCalledWith("id", { count: "exact", head: true });
  expect(eqMock).toHaveBeenCalledWith("id", "target");
  expect(deleteSelectMock).toHaveBeenCalledWith("id");
  expect(deleteUserMock).toHaveBeenCalledWith("target");
});

test("returns 404 and does not delete the auth user if no row matched", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  deleteSelectMock.mockResolvedValue({ data: [], error: null });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Admin not found" });
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("refuses to delete the last remaining admin", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectMock.mockResolvedValue({ count: 1, error: null });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Cannot delete the last remaining admin" });
  expect(deleteMock).not.toHaveBeenCalled();
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("refuses to delete when the count comes back empty", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectMock.mockResolvedValue({ count: null, error: null });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(400);
  expect(deleteMock).not.toHaveBeenCalled();
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("returns 500 if the admin count query fails, and deletes nothing", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectMock.mockResolvedValue({ count: null, error: new Error("db down") });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(500);
  expect(deleteMock).not.toHaveBeenCalled();
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("returns 500 if deleting the row fails, and does not delete the auth user", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  deleteSelectMock.mockResolvedValue({ data: null, error: new Error("row locked") });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(500);
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("returns 500 if deleting the auth user fails", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  deleteSelectMock.mockResolvedValue({ data: [{ id: "target" }], error: null });
  deleteUserMock.mockResolvedValue({ error: new Error("auth service down") });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(500);
});
