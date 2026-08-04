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
});
