import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const connectionMock = vi.fn().mockResolvedValue(undefined);
vi.mock("next/server", () => ({
  connection: () => connectionMock(),
}));

vi.mock("@/components/admin/AdminLoginForm", () => ({
  AdminLoginForm: () => <div data-testid="admin-login-form" />,
}));

import AdminLoginPage from "./page";

test("awaits connection (forcing dynamic rendering) before rendering the form", async () => {
  render(await AdminLoginPage());
  expect(connectionMock).toHaveBeenCalled();
  expect(screen.getByTestId("admin-login-form")).toBeInTheDocument();
});
