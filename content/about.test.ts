import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getAboutContent, aboutContentDefault } from "./about";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the about key and returns the merged result", async () => {
  const merged = { ...aboutContentDefault, character: "Edited character" };
  getSiteContentMock.mockResolvedValue(merged);
  await expect(getAboutContent()).resolves.toEqual(merged);
  expect(getSiteContentMock).toHaveBeenCalledWith("about", aboutContentDefault);
});
