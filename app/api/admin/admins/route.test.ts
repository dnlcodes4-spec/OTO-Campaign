import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const orderMock = vi.fn();
const selectMock = vi.fn(() => ({ order: orderMock }));
const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ select: selectMock, insert: insertMock }));
const createUserMock = vi.fn();
const deleteUserMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: fromMock,
    auth: { admin: { createUser: createUserMock, deleteUser: deleteUserMock } },
  }),
}));

import { GET, POST } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  orderMock.mockReset();
  selectMock.mockClear();
  insertMock.mockReset();
  fromMock.mockClear();
  createUserMock.mockReset();
  deleteUserMock.mockReset();
});

test("GET rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await GET(new Request("http://localhost/api/admin/admins"));
  expect(response.status).toBe(401);
});

test("GET returns the admin list for an authorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  orderMock.mockResolvedValue({
    data: [{ id: "user-1", email: "a@b.com", display_name: "A", created_at: "2026-01-01" }],
    error: null,
  });
  const response = await GET(new Request("http://localhost/api/admin/admins"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.admins).toHaveLength(1);
  expect(fromMock).toHaveBeenCalledWith("oto_admins");
});

test("GET returns 500 on a query error", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  orderMock.mockResolvedValue({ data: null, error: new Error("db down") });
  const response = await GET(new Request("http://localhost/api/admin/admins"));
  expect(response.status).toBe(500);
});

test("POST rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com", password: "x" }),
    })
  );
  expect(response.status).toBe(401);
});

test("POST rejects a request missing email or password", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com" }),
    })
  );
  expect(response.status).toBe(400);
});

test("POST creates the auth user and the oto_admins row", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  createUserMock.mockResolvedValue({ data: { user: { id: "new-user" } }, error: null });
  insertMock.mockResolvedValue({ error: null });

  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com", password: "strong-pass", displayName: "New" }),
    })
  );

  expect(response.status).toBe(201);
  expect(createUserMock).toHaveBeenCalledWith({
    email: "new@b.com",
    password: "strong-pass",
    email_confirm: true,
  });
  expect(insertMock).toHaveBeenCalledWith({
    id: "new-user",
    email: "new@b.com",
    display_name: "New",
    created_by: "user-1",
  });
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("POST rolls back the auth user if the oto_admins insert fails", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  createUserMock.mockResolvedValue({ data: { user: { id: "new-user" } }, error: null });
  insertMock.mockResolvedValue({ error: new Error("duplicate email") });
  deleteUserMock.mockResolvedValue({ error: null });

  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com", password: "strong-pass" }),
    })
  );

  expect(response.status).toBe(500);
  expect(deleteUserMock).toHaveBeenCalledWith("new-user");
});

test("POST logs an error if the rollback fails", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  createUserMock.mockResolvedValue({ data: { user: { id: "new-user" } }, error: null });
  insertMock.mockResolvedValue({ error: new Error("duplicate email") });
  deleteUserMock.mockResolvedValue({ error: new Error("rollback failed") });

  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com", password: "strong-pass" }),
    })
  );

  expect(response.status).toBe(500);
  expect(deleteUserMock).toHaveBeenCalledWith("new-user");
  expect(consoleErrorSpy).toHaveBeenCalled();
  const errorCall = consoleErrorSpy.mock.calls[0];
  expect(errorCall[0]).toMatch(/Failed to roll back auth user new-user/);
  expect(errorCall[1]).toEqual(new Error("rollback failed"));

  consoleErrorSpy.mockRestore();
});
