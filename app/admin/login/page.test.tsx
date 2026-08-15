import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const signInWithPasswordMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword: signInWithPasswordMock } }),
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import AdminLoginPage from "./page";

beforeEach(() => {
  signInWithPasswordMock.mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
});

test("signs in and redirects to /admin on success", async () => {
  signInWithPasswordMock.mockResolvedValue({ error: null });
  render(<AdminLoginPage />);

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
  fireEvent.click(screen.getByText("Sign in"));

  await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
  expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: "a@b.com", password: "secret" });
});

test("shows an error message on failed sign-in", async () => {
  signInWithPasswordMock.mockResolvedValue({ error: new Error("Invalid credentials") });
  render(<AdminLoginPage />);

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
  fireEvent.click(screen.getByText("Sign in"));

  expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
  expect(pushMock).not.toHaveBeenCalled();
});
