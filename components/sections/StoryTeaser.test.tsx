import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoryTeaser } from "./StoryTeaser";
import { storyContentDefault } from "@/content/story";

describe("StoryTeaser", () => {
  test("asks the question and answers it in condensed form", () => {
    render(<StoryTeaser {...storyContentDefault.teaser} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "But who is OTO?" })
    ).toBeInTheDocument();
    for (const paragraph of storyContentDefault.teaser.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });

  test("hands off to the full story page", () => {
    render(<StoryTeaser {...storyContentDefault.teaser} />);
    const link = screen.getByRole("link", { name: /Read the full story/ });
    expect(link).toHaveAttribute("href", "/story");
  });
});
