import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { siteContent } from "@/content/site";

describe("Footer", () => {
  test("renders the candidate name and the one-page nav links", () => {
    render(<Footer />);
    expect(screen.getByText("OTO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/#about");
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("href", "/#agenda");
    expect(screen.getByRole("link", { name: "Get Involved" })).toHaveAttribute(
      "href",
      "/#get-involved"
    );
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "/gallery");
  });

  test("carries the logo mark as a decorative support to the wordmark", () => {
    const { container } = render(<Footer />);
    const mark = container.querySelector('img[src*="oto-logo"]');
    expect(mark).not.toBeNull();
    expect(mark).toHaveAttribute("alt", "");
  });

  test("carries the party badge beside the party line", () => {
    render(<Footer />);
    const badge = screen.getByAltText(siteContent.partyLogo.alt);
    expect(badge).toHaveAttribute("src", expect.stringContaining("zlp-logo.png"));
  });

  test("nav links carry the branded focus-visible outline", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "About" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );
  });
});
