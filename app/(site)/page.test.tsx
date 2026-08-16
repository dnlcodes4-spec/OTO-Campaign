import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("@/content/home", () => ({
  getHomeContent: async () => ({
    headline: "Send someone who actually shows up.",
    intro:
      "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong about eight years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
    portrait: { src: "/images/oto-native.png", alt: "OTO, Oluwasegun Theophilus Oladimeji, in gold agbada and fila" },
  }),
}));

import HomePage from "./page";
import { aboutContent } from "@/content/about";
import { getInvolvedContent } from "@/content/get-involved";
import { siteContent } from "@/content/site";
import { watchContent } from "@/content/watch";

// Same values as the `@/content/home` mock above (kept separate to avoid
// referencing an outer variable inside the hoisted vi.mock factory).
const homeContent = {
  headline: "Send someone who actually shows up.",
  intro:
    "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong about eight years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
  portrait: { src: "/images/oto-native.png", alt: "OTO, Oluwasegun Theophilus Oladimeji, in gold agbada and fila" },
};

function getSection(container: HTMLElement, id: string) {
  const section = container.querySelector(`#${id}`);
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

describe("Home page", () => {
  test("renders the poster headline", async () => {
    render(await HomePage());
    expect(
      screen.getByRole("heading", { level: 1, name: "Send someone who actually shows up." })
    ).toBeInTheDocument();
  });

  test("carries the four one-page sections by id", async () => {
    const { container } = render(await HomePage());
    getSection(container, "about");
    getSection(container, "agenda");
    getSection(container, "watch");
    getSection(container, "get-involved");
  });

  test("about answers the pedigree question", async () => {
    const { container } = render(await HomePage());
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

  test("about features the Atunluto structure inside its plane", async () => {
    const { container } = render(await HomePage());
    const about = getSection(container, "about");
    expect(
      within(about).getByText(/Atunluto caucus within the Zenith Labour Party/)
    ).toBeInTheDocument();
    expect(
      within(about).getByRole("link", { name: /atunluto\.com/ })
    ).toHaveAttribute("href", "https://www.atunluto.com");
  });

  test("agenda carries the six legislative items", async () => {
    const { container } = render(await HomePage());
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

  test("composes the three candidate portraits with their content-file alt text", async () => {
    render(await HomePage());
    // 3 candidate portraits + 2 party badges + 1 featured-video facade poster.
    expect(screen.getAllByRole("img")).toHaveLength(6);
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

  test("features the party badge in the hero and on the vote-targets plane", async () => {
    render(await HomePage());
    const badges = screen.getAllByAltText(siteContent.partyLogo.alt);
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge).toHaveAttribute("src", expect.stringContaining("zlp-logo.png"));
    }
    const hero = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(hero?.querySelector('img[src*="zlp-logo"]')).not.toBeNull();
    const targets = screen.getByText("1,000,000").closest("section");
    expect(targets?.querySelector('img[src*="zlp-logo"]')).not.toBeNull();
  });

  test("the film plane features the current clip as a facade, no embed until pressed", async () => {
    const { container } = render(await HomePage());
    const watch = getSection(container, "watch");
    expect(
      within(watch).getByRole("heading", {
        level: 2,
        name: "Why should you believe a word of this?",
      })
    ).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
    expect(within(watch).getByRole("button", { name: `Play the film: ${watchContent.title}` })).toBeInTheDocument();
  });

  test("get involved carries the asks and the single vote target", async () => {
    const { container } = render(await HomePage());
    const getInvolved = getSection(container, "get-involved");
    expect(within(getInvolved).getByText(/at least ten more/)).toBeInTheDocument();
    expect(within(getInvolved).getByText(/the 2027 election/)).toBeInTheDocument();
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
    expect(screen.queryByText("500,000")).not.toBeInTheDocument();
    expect(
      screen.getByText(/from this target there is enough to win it/)
    ).toBeInTheDocument();
  });
});
