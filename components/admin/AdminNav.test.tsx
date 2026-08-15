import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const usePathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("./SignOutButton", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

import { AdminNav } from "./AdminNav";

test("marks Dashboard active on the exact /admin route", () => {
  usePathnameMock.mockReturnValue("/admin");
  render(<AdminNav />);
  expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Admins" })).not.toHaveAttribute("aria-current");
});

test("marks Gallery active on a nested gallery route", () => {
  usePathnameMock.mockReturnValue("/admin/gallery");
  render(<AdminNav />);
  expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("aria-current", "page");
});

test("does not mark Dashboard active when on a different top-level section", () => {
  usePathnameMock.mockReturnValue("/admin/admins");
  render(<AdminNav />);
  expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
});

test("renders the sign-out control", () => {
  usePathnameMock.mockReturnValue("/admin");
  render(<AdminNav />);
  expect(screen.getByText("Sign out")).toBeInTheDocument();
});
