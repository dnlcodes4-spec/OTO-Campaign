import { beforeEach, expect, test, vi } from "vitest";

const orderMock = vi.fn();
const selectMock = vi.fn(() => ({ order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: fromMock }),
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
});

test("returns an empty array on a query error", async () => {
  orderMock.mockResolvedValue({ data: null, error: new Error("db down") });
  await expect(getGalleryItems()).resolves.toEqual([]);
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
