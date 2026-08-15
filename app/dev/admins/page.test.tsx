import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

vi.mock("./DevAdminSetup", () => ({
  DevAdminSetup: () => <div data-testid="dev-admin-setup" />,
}));

import DevAdminsPage from "./page";

beforeEach(() => {
  notFoundMock.mockClear();
  delete process.env.ADMIN_SETUP_ENABLED;
});

test("calls notFound when setup is not enabled", () => {
  expect(() => DevAdminsPage()).toThrow("NEXT_NOT_FOUND");
  expect(notFoundMock).toHaveBeenCalled();
});

test("renders the setup page when setup is enabled", () => {
  process.env.ADMIN_SETUP_ENABLED = "true";
  render(DevAdminsPage());
  expect(screen.getByTestId("dev-admin-setup")).toBeInTheDocument();
});
