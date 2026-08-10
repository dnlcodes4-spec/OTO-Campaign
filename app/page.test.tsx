import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import HomePage from "./page";
import { homeContent } from "@/content/home";
import { aboutContent } from "@/content/about";
import { getInvolvedContent } from "@/content/get-involved";
import { siteContent } from "@/content/site";

function getSection(container: HTMLElement, id: string) {
  const section = container.querySelector(`#${id}`);
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

describe("Home page", () => {
  test("renders the poster headline", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Send someone who actually shows up." })
    ).toBeInTheDocument();
  });

  test("carries the four one-page sections by id", () => {
    const { container } = render(<HomePage />);
    getSection(container, "about");
    getSection(container, "agenda");
    getSection(container, "watch");
    getSection(container, "get-involved");
  });

  test("about answers the pedigree question", () => {
    const { container } = render(<HomePage />);
    const about = getSection(container, "about");
    expect(
      within(about).getAllByText(/Federal University of Technology, Minna/).length
    ).toBeGreaterThan(0);
    expect(
      within(about).getAllByText(/University of Portsmouth/).length
    ).toBeGreaterThan(0);
    expect(
      within(about).getByText(/He has businesses across states/)
    ).toBeInTheDocument();
    expect(within(about).getByText("Cranfield University")).toBeInTheDocument();
  });

  test("about features the Atunluto structure inside its plane", () => {
    const { container } = render(<HomePage />);
    const about = getSection(container, "about");
    expect(
      within(about).getByText(/Atunluto caucus within the Zenith Labour Party/)
    ).toBeInTheDocument();
    expect(
      within(about).getByRole("link", { name: /atunluto\.com/ })
    ).toHaveAttribute("href", "https://www.atunluto.com");
  });

  test("agenda carries the six legislative items", () => {
    const { container } = render(<HomePage />);
    const agenda = getSection(container, "agenda");
    expect(
      within(agenda).getByRole("heading", { name: "State police" })
    ).toBeInTheDocument();
    expect(
      within(agenda).getByRole("heading", { name: "Residency over state of origin" })
    ).toBeInTheDocument();
    expect(
      within(agenda).getByRole("heading", { name: "Redraft the Civil Defence law" })
    ).toBeInTheDocument();
    expect(
      within(agenda).getByRole("heading", { name: "Warranty laws with teeth" })
    ).toBeInTheDocument();
    expect(
      within(agenda).getByRole("heading", {
        name: "Institutions that answer to the constitution",
      })
    ).toBeInTheDocument();
  });

  test("composes the three candidate portraits with their content-file alt text", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("img")).toHaveLength(5);
    expect(screen.getByAltText(homeContent.portrait.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("oto-native.png")
    );
    expect(screen.getByAltText(aboutContent.portrait.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("oto-suit-2.png")
    );
    expect(screen.getByAltText(getInvolvedContent.image.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("oto-suit-1.png")
    );
  });

  test("features the party badge in the hero and on the vote-targets plane", () => {
    render(<HomePage />);
    const badges = screen.getAllByAltText(siteContent.partyLogo.alt);
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge).toHaveAttribute("src", expect.stringContaining("zlp-logo.png"));
    }
    const hero = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(hero?.querySelector('img[src*="zlp-logo"]')).not.toBeNull();
    const targets = screen.getByText("500,000").closest("section");
    expect(targets?.querySelector('img[src*="zlp-logo"]')).not.toBeNull();
  });

  test("the film plane holds its promise without an embed while the video is unreleased", () => {
    const { container } = render(<HomePage />);
    const watch = getSection(container, "watch");
    expect(
      within(watch).getByRole("heading", {
        level: 2,
        name: "Why should you believe a word of this?",
      })
    ).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
    expect(watch.querySelector("img")).toBeNull();
  });

  test("get involved carries the asks and the vote targets", () => {
    const { container } = render(<HomePage />);
    const getInvolved = getSection(container, "get-involved");
    expect(within(getInvolved).getByText(/at least ten more/)).toBeInTheDocument();
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
    expect(screen.getByText("500,000")).toBeInTheDocument();
  });
});
