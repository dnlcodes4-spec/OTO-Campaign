import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostersTeaser } from "./PostersTeaser";

describe("PostersTeaser", () => {
  test("hands off to the posters page", () => {
    render(<PostersTeaser />);
    expect(
      screen.getByRole("heading", { level: 2, name: /Five posters, yours to spread/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get the posters" })).toHaveAttribute(
      "href",
      "/work-with-us"
    );
  });
});
