import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

/*
 * getSiteContentData() is wrapped in React's cache(), which memoizes by
 * argument (there are none here) for the lifetime of the module instance.
 * Each test needs its own fresh module instance so one test's mocked DB
 * row can't leak into the next via that memoization - hence
 * vi.resetModules() + a dynamic import per test instead of one static
 * top-level import.
 */
beforeEach(() => {
  getSiteContentMock.mockReset();
  vi.resetModules();
});

test("fetches the site key and returns the merged result", async () => {
  const { getSiteContentData, siteContentDefault } = await import("./site");
  getSiteContentMock.mockResolvedValue(siteContentDefault);
  await expect(getSiteContentData()).resolves.toEqual(siteContentDefault);
  expect(getSiteContentMock).toHaveBeenCalledWith("site", siteContentDefault);
});

test("filters out a social entry with a missing platform key", async () => {
  const { getSiteContentData, siteContentDefault } = await import("./site");
  getSiteContentMock.mockResolvedValue({
    ...siteContentDefault,
    socials: [
      ...siteContentDefault.socials,
      // Shape produced by SchemaForm's generic list "Add" button: an empty
      // group item that only ever gets `label`/`href` filled in, since
      // `platform` is deliberately not a declared/editable schema field.
      { label: "x", href: "y" },
    ],
  });

  const result = await getSiteContentData();

  expect(result.socials).toHaveLength(siteContentDefault.socials.length);
  expect(result.socials.some((social) => !("platform" in social))).toBe(false);
});

test("filters out a social entry with an unrecognized platform value", async () => {
  const { getSiteContentData, siteContentDefault } = await import("./site");
  getSiteContentMock.mockResolvedValue({
    ...siteContentDefault,
    socials: [
      ...siteContentDefault.socials,
      { platform: "myspace", label: "MySpace", href: "https://myspace.com/" },
    ],
  });

  const result = await getSiteContentData();

  expect(result.socials).toHaveLength(siteContentDefault.socials.length);
  expect(result.socials.some((social) => (social.platform as string) === "myspace")).toBe(false);
});

test("keeps every well-formed social entry", async () => {
  const { getSiteContentData, siteContentDefault } = await import("./site");
  getSiteContentMock.mockResolvedValue(siteContentDefault);

  const result = await getSiteContentData();

  expect(result.socials).toEqual(siteContentDefault.socials);
});
