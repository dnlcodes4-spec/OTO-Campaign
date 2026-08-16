import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgendaLedger } from "./AgendaLedger";
import { agendaContentDefault } from "@/content/agenda";

describe("AgendaLedger", () => {
  test("draws a custom pictogram for each of the six legislative items", () => {
    render(<AgendaLedger intro={agendaContentDefault.intro} items={agendaContentDefault.items} />);
    for (const id of [
      "pictogram-state-police",
      "pictogram-residency",
      "pictogram-secular-state",
      "pictogram-federating-zones",
      "pictogram-warranty-laws",
      "pictogram-institutions",
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  test("pictograms are decorative and inherit color from the plane", () => {
    render(<AgendaLedger intro={agendaContentDefault.intro} items={agendaContentDefault.items} />);
    for (const id of [
      "pictogram-state-police",
      "pictogram-residency",
      "pictogram-secular-state",
      "pictogram-federating-zones",
      "pictogram-warranty-laws",
      "pictogram-institutions",
    ]) {
      const svg = screen.getByTestId(id);
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg.outerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(svg.outerHTML).toMatch(/currentColor/);
    }
  });
});
