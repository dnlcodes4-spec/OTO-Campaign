import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkWithUsPage from "./page";
import { posters } from "@/content/posters";

describe("WorkWithUsPage", () => {
  test("renders every poster with its own download link", () => {
    render(<WorkWithUsPage />);
    for (const poster of posters) {
      expect(screen.getByAltText(poster.alt)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link", { name: "Download" })).toHaveLength(posters.length);
  });
});
