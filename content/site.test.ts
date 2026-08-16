import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getSiteContentData, siteContentDefault } from "./site";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the site key and returns the merged result", async () => {
  getSiteContentMock.mockResolvedValue(siteContentDefault);
  await expect(getSiteContentData()).resolves.toEqual(siteContentDefault);
  expect(getSiteContentMock).toHaveBeenCalledWith("site", siteContentDefault);
});
