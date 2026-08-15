import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getDashboardStatsMock = vi.fn();
vi.mock("@/lib/admin/dashboard-stats", () => ({
  getDashboardStats: () => getDashboardStatsMock(),
}));

import AdminDashboardPage from "./page";

test("renders the admin, photo, and video counts", async () => {
  getDashboardStatsMock.mockResolvedValue({ admins: 2, images: 121, videos: 3 });
  render(await AdminDashboardPage());

  expect(screen.getByText("Admins")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("Photos")).toBeInTheDocument();
  expect(screen.getByText("121")).toBeInTheDocument();
  expect(screen.getByText("Videos")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
});

test("links to the admins and gallery management pages", async () => {
  getDashboardStatsMock.mockResolvedValue({ admins: 0, images: 0, videos: 0 });
  render(await AdminDashboardPage());

  expect(screen.getByRole("link", { name: /Manage admins/ })).toHaveAttribute(
    "href",
    "/admin/admins"
  );
  expect(screen.getByRole("link", { name: /Manage gallery/ })).toHaveAttribute(
    "href",
    "/admin/gallery"
  );
});
