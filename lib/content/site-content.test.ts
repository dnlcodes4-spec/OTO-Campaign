import { beforeEach, expect, test, vi } from "vitest";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const createClientMock = vi.fn(async () => ({ from: fromMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

import { deepMergeContent, getSiteContent } from "./site-content";

beforeEach(() => {
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
  createClientMock.mockReset();
  createClientMock.mockImplementation(async () => ({ from: fromMock }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

test("returns the fallback untouched when no row exists yet", async () => {
  maybeSingleMock.mockResolvedValue({ data: null, error: null });
  const fallback = { headline: "Default headline", intro: "Default intro" };
  await expect(getSiteContent("home", fallback)).resolves.toEqual(fallback);
});

test("returns the fallback untouched on a query error, logging server-side", async () => {
  maybeSingleMock.mockResolvedValue({ data: null, error: new Error("db down") });
  const fallback = { headline: "Default headline" };
  await expect(getSiteContent("home", fallback)).resolves.toEqual(fallback);
  expect(console.error).toHaveBeenCalledWith(expect.stringContaining("oto_site_content"), expect.any(Error));
});

test("lets a Next.js internal signal propagate instead of swallowing it", async () => {
  const signal = Object.assign(new Error("Dynamic server usage"), { digest: "DYNAMIC_SERVER_USAGE" });
  createClientMock.mockImplementation(async () => {
    throw signal;
  });
  await expect(getSiteContent("home", { headline: "x" })).rejects.toBe(signal);
});

test("DB values override the fallback for matching top-level keys", async () => {
  maybeSingleMock.mockResolvedValue({ data: { content: { headline: "Edited headline" } }, error: null });
  const fallback = { headline: "Default headline", intro: "Default intro" };
  await expect(getSiteContent("home", fallback)).resolves.toEqual({
    headline: "Edited headline",
    intro: "Default intro",
  });
});

test("a nested group merges recursively, keeping fallback keys the DB row omits", async () => {
  maybeSingleMock.mockResolvedValue({
    data: { content: { portrait: { alt: "Edited alt" } } },
    error: null,
  });
  const fallback = { portrait: { src: "/images/x.png", alt: "Default alt" } };
  await expect(getSiteContent("home", fallback)).resolves.toEqual({
    portrait: { src: "/images/x.png", alt: "Edited alt" },
  });
});

test("a list/array field from the DB replaces the fallback array wholesale, not merged element by element", async () => {
  maybeSingleMock.mockResolvedValue({
    data: { content: { points: ["Only one edited point"] } },
    error: null,
  });
  const fallback = { points: ["First default point", "Second default point"] };
  await expect(getSiteContent("home", fallback)).resolves.toEqual({ points: ["Only one edited point"] });
});

test("deepMergeContent: a null nested DB value falls back to the fallback's value at that key, not null", () => {
  const fallback = { portrait: { src: "/images/x.png", alt: "Default alt" } };
  expect(deepMergeContent({ portrait: { alt: null } }, fallback)).toEqual({
    portrait: { src: "/images/x.png", alt: "Default alt" },
  });
});

test("deepMergeContent: a top-level null dbValue returns the fallback entirely", () => {
  const fallback = { headline: "Default headline", intro: "Default intro" };
  expect(deepMergeContent(null, fallback)).toEqual(fallback);
});

test("uses the row's own key filter and the oto_site_content table", async () => {
  maybeSingleMock.mockResolvedValue({ data: null, error: null });
  await getSiteContent("agenda", { intro: "x" });
  expect(fromMock).toHaveBeenCalledWith("oto_site_content");
  expect(selectMock).toHaveBeenCalledWith("content");
  expect(eqMock).toHaveBeenCalledWith("key", "agenda");
});
