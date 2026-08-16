import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getHomeContent, homeContentDefault } from "./home";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the home key and returns the merged result", async () => {
  const merged = { ...homeContentDefault, headline: "Edited headline" };
  getSiteContentMock.mockResolvedValue(merged);
  await expect(getHomeContent()).resolves.toEqual(merged);
  expect(getSiteContentMock).toHaveBeenCalledWith("home", homeContentDefault);
});
