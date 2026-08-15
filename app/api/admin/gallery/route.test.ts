import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const orderMock = vi.fn();
const selectListMock = vi.fn(() => ({ order: orderMock }));
const singleMock = vi.fn();
const selectInsertMock = vi.fn(() => ({ single: singleMock }));
const insertMock = vi.fn(() => ({ select: selectInsertMock }));
const fromMock = vi.fn(() => ({ select: selectListMock, insert: insertMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import { GET, POST } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  orderMock.mockReset();
  selectListMock.mockClear();
  singleMock.mockReset();
  selectInsertMock.mockClear();
  insertMock.mockClear();
  fromMock.mockClear();
});

test("GET rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await GET(new Request("http://localhost/api/admin/gallery"));
  expect(response.status).toBe(401);
});

test("GET returns the gallery list for an authorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  orderMock.mockResolvedValue({
    data: [
      {
        id: "1",
        media_type: "image",
        url: "https://res.cloudinary.com/test-cloud/image/upload/oto-gallery/y.jpg",
        duration_seconds: null,
        caption: "",
        storage_path: "oto-gallery/y",
        created_at: "2026-01-01",
      },
    ],
    error: null,
  });
  const response = await GET(new Request("http://localhost/api/admin/gallery"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.items).toHaveLength(1);
  expect(fromMock).toHaveBeenCalledWith("oto_gallery");
});

test("GET returns 500 on a query error", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  orderMock.mockResolvedValue({ data: null, error: new Error("db down") });
  const response = await GET(new Request("http://localhost/api/admin/gallery"));
  expect(response.status).toBe(500);
});

test("POST rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ url: "https://x/y.jpg", storagePath: "oto-gallery/y", mediaType: "image" }),
    })
  );
  expect(response.status).toBe(401);
});

test("POST rejects a request missing required fields", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ url: "https://x/y.jpg" }),
    })
  );
  expect(response.status).toBe(400);
});

test("POST rejects an invalid mediaType", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ url: "https://x/y.jpg", storagePath: "oto-gallery/y", mediaType: "audio" }),
    })
  );
  expect(response.status).toBe(400);
});

test("POST inserts a new gallery row", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  singleMock.mockResolvedValue({
    data: {
      id: "2",
      media_type: "image",
      url: "https://x/y.jpg",
      duration_seconds: null,
      caption: "Rally",
      storage_path: "oto-gallery/y",
      created_at: "2026-01-02",
    },
    error: null,
  });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({
        url: "https://x/y.jpg",
        storagePath: "oto-gallery/y",
        mediaType: "image",
        caption: "Rally",
      }),
    })
  );
  expect(response.status).toBe(201);
  expect(insertMock).toHaveBeenCalledWith({
    url: "https://x/y.jpg",
    storage_path: "oto-gallery/y",
    media_type: "image",
    duration_seconds: null,
    caption: "Rally",
    uploaded_by: "user-1",
  });
});

test("POST returns 500 on insert error", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  singleMock.mockResolvedValue({ data: null, error: new Error("db error") });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ url: "https://x/y.jpg", storagePath: "oto-gallery/y", mediaType: "image" }),
    })
  );
  expect(response.status).toBe(500);
});
