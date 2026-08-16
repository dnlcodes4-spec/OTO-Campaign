import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getGetInvolvedContent, getInvolvedContentDefault } from "./get-involved";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the get-involved key and returns the merged result", async () => {
  const merged = { ...getInvolvedContentDefault, turnoutBody: "Edited turnout body" };
  getSiteContentMock.mockResolvedValue(merged);
  await expect(getGetInvolvedContent()).resolves.toEqual(merged);
  expect(getSiteContentMock).toHaveBeenCalledWith("get-involved", getInvolvedContentDefault);
});
