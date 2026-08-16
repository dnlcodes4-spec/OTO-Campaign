import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import StoryPage from "./page";
import { storyContentDefault } from "@/content/story";

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
});
