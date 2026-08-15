import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const maybeSingleMock = vi.fn();
const selectUpdateMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const eqUpdateMock = vi.fn(() => ({ select: selectUpdateMock }));
const updateMock = vi.fn(() => ({ eq: eqUpdateMock }));

const selectDeleteMock = vi.fn();
const eqDeleteMock = vi.fn(() => ({ select: selectDeleteMock }));
const deleteMock = vi.fn(() => ({ eq: eqDeleteMock }));

const fromMock = vi.fn(() => ({ update: updateMock, delete: deleteMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

const destroyMock = vi.fn();
vi.mock("@/lib/cloudinary", () => ({
  cloudinary: { uploader: { destroy: (...args: unknown[]) => destroyMock(...args) } },
}));

import { DELETE, PATCH } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  maybeSingleMock.mockReset();
  selectUpdateMock.mockClear();
  eqUpdateMock.mockClear();
  updateMock.mockClear();
  selectDeleteMock.mockReset();
  eqDeleteMock.mockClear();
  deleteMock.mockClear();
  fromMock.mockClear();
  destroyMock.mockReset();
});

test("PATCH rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await PATCH(
    new Request("http://localhost/api/admin/gallery/1", {
      method: "PATCH",
      body: JSON.stringify({ caption: "x" }),
    }),
    { params: Promise.resolve({ id: "1" }) }
  );
  expect(response.status).toBe(401);
});

test("PATCH rejects a missing caption", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await PATCH(
    new Request("http://localhost/api/admin/gallery/1", { method: "PATCH", body: JSON.stringify({}) }),
    { params: Promise.resolve({ id: "1" }) }
  );
  expect(response.status).toBe(400);
});

test("PATCH updates the caption", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  maybeSingleMock.mockResolvedValue({
    data: {
      id: "1",
      media_type: "image",
      url: "https://x/y.jpg",
      duration_seconds: null,
      caption: "New caption",
      storage_path: "oto-gallery/y",
      created_at: "2026-01-01",
    },
    error: null,
  });
  const response = await PATCH(
    new Request("http://localhost/api/admin/gallery/1", {
      method: "PATCH",
      body: JSON.stringify({ caption: "New caption" }),
    }),
    { params: Promise.resolve({ id: "1" }) }
  );
  expect(response.status).toBe(200);
  expect(updateMock).toHaveBeenCalledWith({ caption: "New caption" });
  expect(eqUpdateMock).toHaveBeenCalledWith("id", "1");
});

test("PATCH returns 404 when the item does not exist", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  maybeSingleMock.mockResolvedValue({ data: null, error: null });
  const response = await PATCH(
    new Request("http://localhost/api/admin/gallery/missing", {
      method: "PATCH",
      body: JSON.stringify({ caption: "x" }),
    }),
    { params: Promise.resolve({ id: "missing" }) }
  );
  expect(response.status).toBe(404);
});

test("DELETE rejects an unauthorized caller and never touches the database", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await DELETE(new Request("http://localhost/api/admin/gallery/1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "1" }),
  });
  expect(response.status).toBe(401);
  expect(fromMock).not.toHaveBeenCalled();
});

test("DELETE returns 404 and never calls Cloudinary if nothing matched", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectDeleteMock.mockResolvedValue({ data: [], error: null });
  const response = await DELETE(
    new Request("http://localhost/api/admin/gallery/missing", { method: "DELETE" }),
    { params: Promise.resolve({ id: "missing" }) }
  );
  expect(response.status).toBe(404);
  expect(destroyMock).not.toHaveBeenCalled();
});

test("DELETE removes the row and the Cloudinary asset with the right resource type", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectDeleteMock.mockResolvedValue({
    data: [{ storage_path: "oto-gallery/y", media_type: "video" }],
    error: null,
  });
  destroyMock.mockResolvedValue({ result: "ok" });
  const response = await DELETE(new Request("http://localhost/api/admin/gallery/1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "1" }),
  });
  expect(response.status).toBe(200);
  expect(destroyMock).toHaveBeenCalledWith("oto-gallery/y", { resource_type: "video" });
});

test("DELETE still returns ok if the Cloudinary cleanup fails", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectDeleteMock.mockResolvedValue({
    data: [{ storage_path: "oto-gallery/y", media_type: "image" }],
    error: null,
  });
  destroyMock.mockRejectedValue(new Error("cloudinary down"));
  const response = await DELETE(new Request("http://localhost/api/admin/gallery/1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "1" }),
  });
  expect(response.status).toBe(200);
});
