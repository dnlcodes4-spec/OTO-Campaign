import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getSenatorJobContent, senatorJobContentDefault } from "./senator-job";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the senator-job key and returns the merged result", async () => {
  const merged = { ...senatorJobContentDefault, intro: "Edited intro" };
  getSiteContentMock.mockResolvedValue(merged);
  await expect(getSenatorJobContent()).resolves.toEqual(merged);
  expect(getSiteContentMock).toHaveBeenCalledWith("senator-job", senatorJobContentDefault);
});
