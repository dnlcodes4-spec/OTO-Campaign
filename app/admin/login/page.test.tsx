import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword: signInWithPasswordMock, signOut: signOutMock },
  }),
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import AdminLoginPage from "./page";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  signInWithPasswordMock.mockReset();
  signOutMock.mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  global.fetch = fetchMock as unknown as typeof fetch;
});

test("signs in and redirects to /admin on success", async () => {
  signInWithPasswordMock.mockResolvedValue({ error: null });
  render(<AdminLoginPage />);

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
  fireEvent.click(screen.getByText("Sign in"));

  await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
  expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: "a@b.com", password: "secret" });
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/admins");
  expect(signOutMock).not.toHaveBeenCalled();
});

test("signs a non-admin back out and explains why, instead of redirecting", async () => {
  signInWithPasswordMock.mockResolvedValue({ error: null });
  fetchMock.mockResolvedValue({ ok: false, status: 401 });
  signOutMock.mockResolvedValue({ error: null });
  render(<AdminLoginPage />);

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "atunluto@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
  fireEvent.click(screen.getByText("Sign in"));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This account does not have admin access."
  );
  expect(signOutMock).toHaveBeenCalled();
  expect(pushMock).not.toHaveBeenCalled();
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
