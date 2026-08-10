import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoryTeaser } from "./StoryTeaser";
import { storyContent } from "@/content/story";

describe("StoryTeaser", () => {
  test("asks the question and answers it in condensed form", () => {
    render(<StoryTeaser />);
    expect(
      screen.getByRole("heading", { level: 2, name: "But who is OTO?" })
    ).toBeInTheDocument();
    for (const paragraph of storyContent.teaser.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });

  test("hands off to the full story page", () => {
    render(<StoryTeaser />);
    const link = screen.getByRole("link", { name: /Read the full story/ });
    expect(link).toHaveAttribute("href", "/story");
  });
});
