import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AtunlutoBlock } from "./AtunlutoBlock";
import { atunlutoContentDefault } from "@/content/atunluto";

describe("AtunlutoBlock", () => {
  test("names the Atunluto caucus within the Zenith Labour Party", () => {
    render(<AtunlutoBlock {...atunlutoContentDefault} />);
    expect(
      screen.getByText(/Atunluto caucus within the Zenith Labour Party/)
    ).toBeInTheDocument();
  });

  test("links out to the group's own site in a new tab", () => {
    render(<AtunlutoBlock {...atunlutoContentDefault} />);
    const link = screen.getByRole("link", { name: /atunluto\.com/ });
    expect(link).toHaveAttribute("href", "https://www.atunluto.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("carries the running interventions and a compact cut of the Six Pillars", () => {
    render(<AtunlutoBlock {...atunlutoContentDefault} />);
    expect(screen.getByText(/Interest-free member loans/)).toBeInTheDocument();
    expect(screen.getByText(/WAEC fee/)).toBeInTheDocument();
    expect(screen.getByText(/10 tractors/)).toBeInTheDocument();
    expect(screen.getByText(/CNG buses/)).toBeInTheDocument();
  });

  test("keeps the group figures faithful: founded 2024, 800 plus members, five of nine LGAs", () => {
    render(<AtunlutoBlock {...atunlutoContentDefault} />);
    const figures = atunlutoContentDefault.stats.map((stat) => stat.figure);
    expect(figures).toEqual(["2024", "800+", "5 of 9"]);
    for (const stat of atunlutoContentDefault.stats) {
      expect(screen.getByText(stat.figure)).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
  });

  test("steps the heading hierarchy one level at a time", () => {
    render(<AtunlutoBlock {...atunlutoContentDefault} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    const subheads = screen.getAllByRole("heading", { level: 3 });
    expect(subheads.map((heading) => heading.textContent)).toEqual([
      atunlutoContentDefault.running.title,
      atunlutoContentDefault.pillars.title,
    ]);
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
  });

  test("states the cooperative model in the support copy", () => {
    render(<AtunlutoBlock {...atunlutoContentDefault} />);
    expect(screen.getByText(/cooperative thrift/)).toBeInTheDocument();
  });
});
