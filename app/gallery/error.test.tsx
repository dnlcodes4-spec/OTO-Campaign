import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GalleryError from "./error";

describe("Gallery error state", () => {
  test("calls retry when the button is clicked", () => {
    const retry = vi.fn();
    render(<GalleryError error={new Error("failed")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
