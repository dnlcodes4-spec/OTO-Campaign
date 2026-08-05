import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { GetInvolvedBlock } from "./GetInvolvedBlock";
import { getInvolvedContent } from "@/content/get-involved";

describe("GetInvolvedBlock", () => {
  test("tells the turnout story as stacked figures with their labels and body", () => {
    render(<GetInvolvedBlock />);
    for (const stat of getInvolvedContent.turnoutStats) {
      expect(screen.getByText(stat.figure)).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
    expect(
      screen.getByText(/Three million people sit out every cycle/)
    ).toBeInTheDocument();
  });

  test("keeps the turnout figures faithful to the registration and participation facts", () => {
    const figures = getInvolvedContent.turnoutStats.map((stat) => stat.figure);
    expect(figures).toEqual(["4,000,000", "1 in 3"]);
    expect(getInvolvedContent.turnoutStats[0].label).toMatch(
      /registered voters in Oyo State/
    );
    expect(getInvolvedContent.turnoutBody).toMatch(/Three million people sit out/);
  });

  test("runs the four asks as a numbered ledger ahead of the portrait panel", () => {
    render(<GetInvolvedBlock />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    for (const ask of getInvolvedContent.asks) {
      expect(screen.getByRole("heading", { name: ask.title })).toBeInTheDocument();
    }
    const list = screen.getByRole("list");
    const portrait = screen.getByRole("img");
    expect(
      list.compareDocumentPosition(portrait) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  test("composes the portrait with its content-file description", () => {
    render(<GetInvolvedBlock />);
    expect(screen.getByAltText(getInvolvedContent.image.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("oto-suit-1.png")
    );
  });

  test("owns the full-bleed poster section that carries the get-involved id", () => {
    const { container } = render(<GetInvolvedBlock />);
    expect(container.querySelector("section#get-involved")).not.toBeNull();
  });

  test("sets the vote targets as the poster backdrop with the lead and both labels", () => {
    render(<GetInvolvedBlock />);
    expect(screen.getByText(getInvolvedContent.targetsLead)).toBeInTheDocument();
    for (const target of getInvolvedContent.targets) {
      expect(screen.getByText(target.figure)).toBeInTheDocument();
      expect(screen.getByText(target.label)).toBeInTheDocument();
    }
    expect(getInvolvedContent.targets.map((target) => target.figure)).toEqual([
      "1,000,000",
      "500,000",
    ]);
  });

  test("closes the poster with the Nehemiah epigraph", () => {
    render(<GetInvolvedBlock />);
    expect(
      screen.getByText(/seek the welfare of the children of Oyo South/)
    ).toBeInTheDocument();
  });
});
