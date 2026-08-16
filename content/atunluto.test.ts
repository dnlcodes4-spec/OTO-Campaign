import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getAtunlutoContent, atunlutoContentDefault } from "./atunluto";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the atunluto key and returns the merged result", async () => {
  const merged = { ...atunlutoContentDefault, answer: "Edited answer" };
  getSiteContentMock.mockResolvedValue(merged);
  await expect(getAtunlutoContent()).resolves.toEqual(merged);
  expect(getSiteContentMock).toHaveBeenCalledWith("atunluto", atunlutoContentDefault);
});
