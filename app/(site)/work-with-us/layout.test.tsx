import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkWithUsLayout from "./layout";

describe("WorkWithUsLayout", () => {
  test("frames the posters with the three asks and hands off to Get Involved", () => {
    render(
      <WorkWithUsLayout>
        <div>Poster grid</div>
      </WorkWithUsLayout>
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Carry the message yourself" })
    ).toBeInTheDocument();
    expect(screen.getByText("Poster grid")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "put something behind the campaign" })
    ).toHaveAttribute("href", "/#get-involved");
  });
});
