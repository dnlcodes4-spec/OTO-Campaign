import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import StoryPage from "./page";
import { storyContent } from "@/content/story";

describe("StoryPage", () => {
  test("tells the full story under its own h1", () => {
    render(<StoryPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "But who is OTO?" })
    ).toBeInTheDocument();
    expect(screen.getByText(storyContent.page.lead)).toBeInTheDocument();
    for (const section of storyContent.page.sections) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.heading })
      ).toBeInTheDocument();
    }
  });

  test("closes by handing back to the agenda", () => {
    render(<StoryPage />);
    expect(screen.getByText(storyContent.page.closing.line)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: storyContent.page.closing.cta })
    ).toHaveAttribute("href", "/#agenda");
  });
});
