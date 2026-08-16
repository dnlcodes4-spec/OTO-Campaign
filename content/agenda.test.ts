import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getAgendaContent, agendaContentDefault } from "./agenda";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the agenda key and returns the merged result", async () => {
  const merged = {
    ...agendaContentDefault,
    intro: "Edited intro",
  };
  getSiteContentMock.mockResolvedValue(merged);
  await expect(getAgendaContent()).resolves.toEqual(merged);
  expect(getSiteContentMock).toHaveBeenCalledWith("agenda", agendaContentDefault);
});
