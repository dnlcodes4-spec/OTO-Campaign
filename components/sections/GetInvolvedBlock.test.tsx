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
    expect(figures).toEqual(["4,000,000", "1 in 4"]);
    expect(getInvolvedContent.turnoutStats[0].label).toMatch(
      /registered voters in Oyo State/
    );
    expect(getInvolvedContent.turnoutBody).toMatch(/Three million people sit out/);
  });

  test("runs the five asks as a numbered ledger ahead of the portrait panel", () => {
    render(<GetInvolvedBlock />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    for (const ask of getInvolvedContent.asks) {
      expect(screen.getByRole("heading", { name: ask.title })).toBeInTheDocument();
    }
    const list = screen.getByRole("list");
    const portrait = screen.getByRole("img");
    expect(
      list.compareDocumentPosition(portrait) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  test("asks for financial commitment fourth, with the count kept last", () => {
    expect(getInvolvedContent.asks.map((ask) => ask.number)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    expect(getInvolvedContent.asks.map((ask) => ask.title)).toEqual([
      "Make up your mind",
      "Talk to ten",
      "Volunteer on the trail",
      "Be financially committed",
      "Commit to the count",
    ]);
    const financial = getInvolvedContent.asks[3];
    expect(financial.detail).toMatch(/godfather/);
    expect(financial.detail).toMatch(/nine LGAs of Oyo South/);
  });

  test("composes the portrait with its content-file description", () => {
    render(<GetInvolvedBlock />);
    expect(screen.getByAltText(getInvolvedContent.image.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("oto-suit-1.png")
    );
  });
});
