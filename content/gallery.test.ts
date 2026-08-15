import { afterEach, beforeEach, expect, test, vi } from "vitest";

const orderMock = vi.fn();
const selectMock = vi.fn(() => ({ order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const createClientMock = vi.fn(async () => ({ from: fromMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/cloudinary", () => ({
  buildPosterUrl: (publicId: string) =>
    `https://res.cloudinary.com/test-cloud/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/${publicId}.jpg`,
}));

import { getGalleryItems } from "./gallery";

beforeEach(() => {
  orderMock.mockReset();
  selectMock.mockClear();
  fromMock.mockClear();
  createClientMock.mockReset();
  createClientMock.mockImplementation(async () => ({ from: fromMock }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("returns an empty array on a query error", async () => {
  orderMock.mockResolvedValue({ data: null, error: new Error("db down") });
  await expect(getGalleryItems()).resolves.toEqual([]);
});

test("logs the query error server-side instead of failing silently", async () => {
  const queryError = new Error("db down");
  orderMock.mockResolvedValue({ data: null, error: queryError });
  await getGalleryItems();
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining("oto_gallery"),
    queryError
  );
});

test("catches an error thrown while creating the Supabase client and returns an empty array", async () => {
  createClientMock.mockImplementation(async () => {
    throw new Error("supabaseUrl is required.");
  });
  await expect(getGalleryItems()).resolves.toEqual([]);
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining("oto_gallery"),
    expect.any(Error)
  );
});

test("maps image rows without a posterUrl", async () => {
  orderMock.mockResolvedValue({
    data: [
      {
        id: "1",
        media_type: "image",
        url: "https://x/y.jpg",
        storage_path: "oto-gallery/y",
        caption: "Rally",
        created_at: "2026-01-01",
      },
    ],
    error: null,
  });
  const items = await getGalleryItems();
  expect(items).toEqual([
    { id: "1", type: "image", url: "https://x/y.jpg", posterUrl: undefined, caption: "Rally", createdAt: "2026-01-01" },
  ]);
  expect(fromMock).toHaveBeenCalledWith("oto_gallery");
});

test("maps video rows with a derived posterUrl", async () => {
  orderMock.mockResolvedValue({
    data: [
      {
        id: "2",
        media_type: "video",
        url: "https://x/v.mp4",
        storage_path: "oto-gallery/v",
        caption: "Launch",
        created_at: "2026-01-02",
      },
    ],
    error: null,
  });
  const items = await getGalleryItems();
  expect(items[0].posterUrl).toBe(
    "https://res.cloudinary.com/test-cloud/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/oto-gallery/v.jpg"
  );
  expect(items[0].type).toBe("video");
});
