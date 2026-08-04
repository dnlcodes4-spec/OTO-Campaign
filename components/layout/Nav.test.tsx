import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Nav } from "./Nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Nav", () => {
  test("mobile menu is closed by default and toggles open and closed", () => {
    render(<Nav />);

    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(openButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(openButton);
    const closeButton = screen.getByRole("button", { name: "Close menu" });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(closeButton);
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  });

  test("renders the wordmark linking home", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "OTO" })).toHaveAttribute("href", "/");
  });
});
