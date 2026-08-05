import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import HomePage from "./page";

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

  test("carries the three one-page sections by id", () => {
    const { container } = render(<HomePage />);
    getSection(container, "about");
    getSection(container, "agenda");
    getSection(container, "get-involved");
  });

  test("about answers the pedigree question", () => {
    const { container } = render(<HomePage />);
    const about = getSection(container, "about");
    expect(
      within(about).getByText(/Federal University of Technology, Minna/)
    ).toBeInTheDocument();
    expect(within(about).getByText(/University of Portsmouth/)).toBeInTheDocument();
  });

  test("agenda carries the four legislative items", () => {
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
  });

  test("get involved carries the asks and the vote targets", () => {
    const { container } = render(<HomePage />);
    const getInvolved = getSection(container, "get-involved");
    expect(within(getInvolved).getByText(/at least ten more/)).toBeInTheDocument();
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
    expect(screen.getByText("500,000")).toBeInTheDocument();
  });
});
