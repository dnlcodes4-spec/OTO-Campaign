import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/admin/AdminsManager", () => ({
  AdminsManager: () => <div data-testid="admins-manager" />,
}));

import AdminAdminsPage from "./page";

test("renders a heading and the AdminsManager component", () => {
  render(<AdminAdminsPage />);
  expect(screen.getByText("Admins")).toBeInTheDocument();
  expect(screen.getByTestId("admins-manager")).toBeInTheDocument();
});
