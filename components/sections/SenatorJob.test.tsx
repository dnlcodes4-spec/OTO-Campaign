import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { SenatorJob } from "./SenatorJob";
import { senatorJobContent } from "@/content/senator-job";

describe("SenatorJob", () => {
  test("lays out the four segments of the job under the question", () => {
    render(<SenatorJob />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "So what does a senator actually do all day?",
      })
    ).toBeInTheDocument();
    for (const segment of senatorJobContent.segments) {
      expect(
        screen.getByRole("heading", { level: 3, name: segment.title })
      ).toBeInTheDocument();
    }
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });

  test("closes on the brief's standing challenge", () => {
    render(<SenatorJob />);
    expect(screen.getByText(senatorJobContent.challenge)).toBeInTheDocument();
  });
});
