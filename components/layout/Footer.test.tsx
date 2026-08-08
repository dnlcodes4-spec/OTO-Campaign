import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { siteContent, socials } from "@/content/site";

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

  test("names the Atunluto caucus in the identity line", () => {
    render(<Footer />);
    expect(screen.getByText(/from the Atunluto caucus/)).toBeInTheDocument();
  });

  test("nav links carry the branded focus-visible outline", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "About" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );
  });

  test("carries the four social channels as labelled external links", () => {
    render(<Footer />);
    expect(socials).toHaveLength(4);
    for (const social of socials) {
      const link = screen.getByRole("link", { name: `OTO on ${social.label}` });
      expect(link).toHaveAttribute("href", social.href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.className).toContain("focus-visible:outline-brand-gold");
    }
  });

  test("keeps the platform marks decorative: the link label carries the name", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "OTO on Facebook" });
    const mark = link.querySelector("svg");
    expect(mark).not.toBeNull();
    expect(mark).toHaveAttribute("aria-hidden", "true");
    for (const path of Array.from(link.querySelectorAll("path"))) {
      expect(path.getAttribute("fill")).toBe("currentColor");
    }
  });
});
