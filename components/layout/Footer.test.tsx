import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  test("renders the candidate name and nav links", () => {
    render(<Footer />);
    expect(screen.getByText("OTO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Get Involved" })).toHaveAttribute("href", "/get-involved");
  });
});
