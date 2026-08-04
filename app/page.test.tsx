import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("Home page", () => {
  test("renders the headline and all three teasers", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Send someone who actually shows up." })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read the agenda/i })).toHaveAttribute("href", "/agenda");
    expect(screen.getByRole("link", { name: /read the pedigree/i })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: /see the gallery/i })).toHaveAttribute("href", "/gallery");
  });
});
