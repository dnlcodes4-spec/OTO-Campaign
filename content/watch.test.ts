import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getWatchContent, watchContentDefault } from "./watch";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the watch key and returns the merged result", async () => {
  getSiteContentMock.mockResolvedValue(watchContentDefault);
  await expect(getWatchContent()).resolves.toEqual(watchContentDefault);
  expect(getSiteContentMock).toHaveBeenCalledWith("watch", watchContentDefault);
});

test("the video field is never sent through the CMS merge, only editorial text is", async () => {
  getSiteContentMock.mockResolvedValue(watchContentDefault);
  await getWatchContent();
  const [, fallbackArg] = getSiteContentMock.mock.calls[0];
  expect(fallbackArg.video).toEqual(watchContentDefault.video);
});
