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

/*
 * There used to be a test here asserting `fallbackArg.video ===
 * watchContentDefault.video` after calling getWatchContent(). It was
 * tautological: `fallbackArg` IS `watchContentDefault` (the same object
 * reference — getWatchContent()'s whole body is `getSiteContent("watch",
 * watchContentDefault)`), so the assertion passed unconditionally and could
 * never catch a regression. It gave false confidence without exercising
 * either the DB round-trip or the admin save path, which is exactly where
 * `video` could leak through (see the review finding on Task 15 round 1).
 *
 * The real protection isn't in this module at all — it's in what
 * app/(site)/page.tsx does with getWatchContent()'s *merged* result. That
 * is covered by a rendering-level test in app/(site)/page.test.tsx
 * ("the video prop stays sourced from watchContentDefault even if a
 * poisoned/merged CMS row returns a different video"), which mocks a
 * poisoned merge result and asserts the actually-rendered video state
 * still reflects watchContentDefault.video, not the merged value.
 */
