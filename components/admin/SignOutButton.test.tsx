import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const signOutMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: signOutMock } }),
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import { SignOutButton } from "./SignOutButton";

beforeEach(() => {
  signOutMock.mockReset();
  signOutMock.mockResolvedValue({ error: null });
  pushMock.mockReset();
  refreshMock.mockReset();
});

test("renders a sign out button", () => {
  render(<SignOutButton />);
  expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
});

test("signs out and sends the visitor to the login page", async () => {
  render(<SignOutButton />);

  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

  await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/login"));
  expect(signOutMock).toHaveBeenCalled();
  expect(refreshMock).toHaveBeenCalled();
});
