import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { SenatorJob } from "./SenatorJob";
import { senatorJobContentDefault } from "@/content/senator-job";

describe("SenatorJob", () => {
  test("lays out the four segments of the job under the question", () => {
    render(<SenatorJob {...senatorJobContentDefault} />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "So what does a senator actually do all day?",
      })
    ).toBeInTheDocument();
    for (const segment of senatorJobContentDefault.segments) {
      expect(
        screen.getByRole("heading", { level: 3, name: segment.title })
      ).toBeInTheDocument();
    }
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });

  test("closes on the brief's standing challenge", () => {
    render(<SenatorJob {...senatorJobContentDefault} />);
    expect(screen.getByText(senatorJobContentDefault.challenge)).toBeInTheDocument();
  });
});
