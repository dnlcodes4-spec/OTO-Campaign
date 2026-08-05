import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Section } from "./Section";

describe("Section", () => {
  test("renders its children", () => {
    render(<Section>content</Section>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
