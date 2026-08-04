import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Loading from "./loading";

describe("Gallery loading state", () => {
  test("renders an accessible loading skeleton", () => {
    render(<Loading />);
    expect(screen.getByLabelText("Loading gallery")).toBeInTheDocument();
  });
});
