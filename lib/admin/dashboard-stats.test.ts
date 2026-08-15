import { beforeEach, expect, test, vi } from "vitest";

const adminsSelectMock = vi.fn();
const galleryEqMock = vi.fn();
const gallerySelectMock = vi.fn(() => ({ eq: galleryEqMock }));
const fromMock = vi.fn((table: string) => {
  if (table === "oto_admins") return { select: adminsSelectMock };
  if (table === "oto_gallery") return { select: gallerySelectMock };
  throw new Error(`Unexpected table: ${table}`);
});
const createAdminClientMock = vi.fn(() => ({ from: fromMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

import { getDashboardStats } from "./dashboard-stats";

beforeEach(() => {
  adminsSelectMock.mockReset();
  galleryEqMock.mockReset();
  gallerySelectMock.mockClear();
  fromMock.mockClear();
  createAdminClientMock.mockReset();
  createAdminClientMock.mockImplementation(() => ({ from: fromMock }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

test("returns the admin, image, and video counts", async () => {
  adminsSelectMock.mockResolvedValue({ count: 3 });
  galleryEqMock.mockImplementation((_column: string, value: string) =>
    Promise.resolve({ count: value === "image" ? 121 : 3 })
  );

  const stats = await getDashboardStats();
  expect(stats).toEqual({ admins: 3, images: 121, videos: 3 });
  expect(fromMock).toHaveBeenCalledWith("oto_admins");
  expect(fromMock).toHaveBeenCalledWith("oto_gallery");
  expect(galleryEqMock).toHaveBeenCalledWith("media_type", "image");
  expect(galleryEqMock).toHaveBeenCalledWith("media_type", "video");
});

test("treats a null count as zero", async () => {
  adminsSelectMock.mockResolvedValue({ count: null });
  galleryEqMock.mockResolvedValue({ count: null });

  const stats = await getDashboardStats();
  expect(stats).toEqual({ admins: 0, images: 0, videos: 0 });
});

test("falls back to all zeros and logs when a query throws", async () => {
  createAdminClientMock.mockImplementation(() => {
    throw new Error("supabaseUrl is required.");
  });
  const stats = await getDashboardStats();
  expect(stats).toEqual({ admins: 0, images: 0, videos: 0 });
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining("dashboard stats"),
    expect.any(Error)
  );
});

test("lets a Next.js internal signal propagate instead of swallowing it", async () => {
  const signal = Object.assign(new Error("Dynamic server usage"), {
    digest: "DYNAMIC_SERVER_USAGE",
  });
  createAdminClientMock.mockImplementation(() => {
    throw signal;
  });
  await expect(getDashboardStats()).rejects.toBe(signal);
});
