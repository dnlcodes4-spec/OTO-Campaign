import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getStoryContent, storyContentDefault } from "./story";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the story key and returns the merged result", async () => {
  const merged = {
    ...storyContentDefault,
    teaser: { ...storyContentDefault.teaser, cta: "Edited cta" },
  };
  getSiteContentMock.mockResolvedValue(merged);
  await expect(getStoryContent()).resolves.toEqual(merged);
  expect(getSiteContentMock).toHaveBeenCalledWith("story", storyContentDefault);
});
