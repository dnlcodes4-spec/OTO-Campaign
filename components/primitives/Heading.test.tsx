import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Heading } from "./Heading";

describe("Heading", () => {
  test("renders the semantic tag matching its level", () => {
    render(<Heading level={2}>Section title</Heading>);
    expect(screen.getByRole("heading", { level: 2, name: "Section title" })).toBeInTheDocument();
  });

  test("renders level 1 as an h1", () => {
    render(<Heading level={1}>Page title</Heading>);
    expect(screen.getByRole("heading", { level: 1, name: "Page title" })).toBeInTheDocument();
  });

  test("keeps its default size classes when no override is given", () => {
    render(<Heading level={1}>Default sizes</Heading>);
    const heading = screen.getByRole("heading", { level: 1, name: "Default sizes" });
    expect(heading.className).toContain("text-5xl");
    expect(heading.className).toContain("font-display");
  });

  test("replaces the default size classes when sizeOverride is given", () => {
    render(
      <Heading level={1} sizeOverride="text-6xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
        Poster sizes
      </Heading>
    );
    const heading = screen.getByRole("heading", { level: 1, name: "Poster sizes" });
    expect(heading.className).not.toContain("text-5xl");
    expect(heading.className).toContain("lg:text-8xl");
    expect(heading.className).toContain("font-display");
    expect(heading.tagName).toBe("H1");
  });
});
