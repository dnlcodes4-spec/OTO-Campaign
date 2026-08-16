import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/*
 * getStoryContent is mocked through a controllable vi.fn() (reset to
 * resolve storyContentDefault in beforeEach below) rather than a fixed
 * async function, so a single test below can make it resolve a *poisoned*
 * merged result — a section missing its `body` key entirely, the exact
 * shape SchemaForm's generic list "Add" button produces for a list-of-group
 * field (see AgendaLedger's `route.points` guard for the same failure mode)
 * — and assert the page does not crash rendering it.
 */
const getStoryContentMock = vi.fn();
vi.mock("@/content/story", async () => {
  const actual = await vi.importActual<typeof import("@/content/story")>("@/content/story");
  return {
    ...actual,
    getStoryContent: () => getStoryContentMock(),
  };
});

import StoryPage from "./page";
import { storyContentDefault } from "@/content/story";

beforeEach(() => {
  getStoryContentMock.mockReset();
  getStoryContentMock.mockResolvedValue(storyContentDefault);
});

describe("StoryPage", () => {
  test("tells the full story under its own h1", async () => {
    render(await StoryPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "But who is OTO?" })
    ).toBeInTheDocument();
    expect(screen.getByText(storyContentDefault.page.lead)).toBeInTheDocument();
    for (const section of storyContentDefault.page.sections) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.heading })
      ).toBeInTheDocument();
    }
  });

  test("closes by handing back to the agenda", async () => {
    render(await StoryPage());
    expect(screen.getByText(storyContentDefault.page.closing.line)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: storyContentDefault.page.closing.cta })
    ).toHaveAttribute("href", "/#agenda");
  });

  test("a section with no body key renders without throwing and shows no paragraph text for it", async () => {
    getStoryContentMock.mockResolvedValue({
      ...storyContentDefault,
      page: {
        ...storyContentDefault.page,
        sections: [
          { heading: "A childhood in Eruwa" },
          ...storyContentDefault.page.sections.slice(1),
        ],
      },
    });

    await expect(StoryPage()).resolves.toBeDefined();
    render(await StoryPage());

    expect(
      screen.getByRole("heading", { level: 2, name: "A childhood in Eruwa" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(storyContentDefault.page.sections[0].body![0])
    ).not.toBeInTheDocument();
  });
});
