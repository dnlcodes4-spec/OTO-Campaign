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

const toastErrorMock = vi.fn();
vi.mock("./ToastProvider", () => ({
  useToast: () => ({ success: vi.fn(), error: toastErrorMock }),
}));

import { SignOutButton } from "./SignOutButton";

beforeEach(() => {
  signOutMock.mockReset();
  signOutMock.mockResolvedValue({ error: null });
  pushMock.mockReset();
  refreshMock.mockReset();
  toastErrorMock.mockReset();
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

test("shows a pending state while signing out", async () => {
  let resolveSignOut: (value: { error: null }) => void = () => {};
  signOutMock.mockReturnValue(
    new Promise((resolve) => {
      resolveSignOut = resolve;
    })
  );

  render(<SignOutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

  expect(await screen.findByRole("button", { name: "Signing out..." })).toBeDisabled();

  resolveSignOut({ error: null });
  await waitFor(() => expect(pushMock).toHaveBeenCalled());
});

test("shows an error toast and recovers the button if signOut fails", async () => {
  signOutMock.mockRejectedValue(new Error("network error"));
  vi.spyOn(console, "error").mockImplementation(() => {});

  render(<SignOutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

  await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("Failed to sign out. Please try again."));
  expect(screen.getByRole("button", { name: "Sign out" })).not.toBeDisabled();
  expect(pushMock).not.toHaveBeenCalled();
});
