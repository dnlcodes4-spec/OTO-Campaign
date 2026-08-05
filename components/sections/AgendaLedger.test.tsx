import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgendaLedger } from "./AgendaLedger";

describe("AgendaLedger", () => {
  test("draws a custom pictogram for each of the four legislative items", () => {
    render(<AgendaLedger />);
    for (const id of [
      "pictogram-state-police",
      "pictogram-residency",
      "pictogram-secular-state",
      "pictogram-federating-zones",
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  test("pictograms are decorative and inherit color from the plane", () => {
    render(<AgendaLedger />);
    for (const id of [
      "pictogram-state-police",
      "pictogram-residency",
      "pictogram-secular-state",
      "pictogram-federating-zones",
    ]) {
      const svg = screen.getByTestId(id);
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg.outerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(svg.outerHTML).toMatch(/currentColor/);
    }
  });
});
