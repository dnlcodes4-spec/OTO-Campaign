import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminsManager } from "./AdminsManager";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock("./ToastProvider", () => ({
  useToast: () => ({ success: toastSuccessMock, error: toastErrorMock }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  // jsdom's window.confirm throws "not implemented"; the delete path always
  // goes through it, so every test needs it stubbed.
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

test("shows a skeleton while the initial list is loading", () => {
  global.fetch = vi.fn().mockReturnValue(new Promise(() => {})) as unknown as typeof fetch;
  render(<AdminsManager />);
  expect(screen.getByLabelText("Loading admins")).toBeInTheDocument();
});

test("loads and displays the admin list on mount", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      admins: [{ id: "1", email: "a@b.com", display_name: "Ada", created_at: "2026-01-01" }],
    }),
  }) as unknown as typeof fetch;

  render(<AdminsManager />);

  expect(await screen.findByText("Ada")).toBeInTheDocument();
  expect(screen.getByText("a@b.com")).toBeInTheDocument();
});

test("shows an empty state when there are no admins", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ admins: [] }),
  }) as unknown as typeof fetch;

  render(<AdminsManager />);

  expect(await screen.findByText("No other admins yet.")).toBeInTheDocument();
});

test("shows the load error when the list request fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Unauthorized" }),
  }) as unknown as typeof fetch;

  render(<AdminsManager />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
});

test("submits the create form, toasts success, and reloads the list", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ admins: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "2", email: "new@b.com" }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        admins: [{ id: "2", email: "new@b.com", display_name: null, created_at: "2026-01-02" }],
      }),
    });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "strong-pass" } });
  fireEvent.click(screen.getByText("Create admin"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  const postCall = fetchMock.mock.calls[1];
  expect(postCall[0]).toBe("/api/admin/admins");
  expect(postCall[1].method).toBe("POST");
  expect(await screen.findByText("new@b.com")).toBeInTheDocument();
  expect(toastSuccessMock).toHaveBeenCalledWith("Admin created.");
});

test("shows the create error inline, not as a toast, so it stays next to the form", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ admins: [] }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Email already in use" }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dupe@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "strong-pass" } });
  fireEvent.click(screen.getByText("Create admin"));

  expect(await screen.findByRole("alert")).toHaveTextContent("Email already in use");
  expect(toastSuccessMock).not.toHaveBeenCalled();
  expect(toastErrorMock).not.toHaveBeenCalled();
});

test("shows a per-row pending state while deleting, and toasts success", async () => {
  const fetchMock = vi.fn();
  let resolveDelete: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => {};
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        admins: [{ id: "1", email: "a@b.com", display_name: "Ada", created_at: "2026-01-01" }],
      }),
    })
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDelete = resolve;
      })
    )
    .mockResolvedValueOnce({ ok: true, json: async () => ({ admins: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager />);
  await screen.findByText("Ada");

  fireEvent.click(screen.getByText("Delete"));

  expect(await screen.findByRole("button", { name: "Deleting..." })).toBeDisabled();

  resolveDelete({ ok: true, json: async () => ({ ok: true }) });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(toastSuccessMock).toHaveBeenCalledWith("Admin deleted.");
});

test("deletes an admin when Delete is clicked", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        admins: [{ id: "1", email: "a@b.com", display_name: "Ada", created_at: "2026-01-01" }],
      }),
    })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ admins: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager />);
  await screen.findByText("Ada");

  fireEvent.click(screen.getByText("Delete"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(fetchMock.mock.calls[1][0]).toBe("/api/admin/admins/1");
  expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
});

test("toasts an error when delete fails, and clears the pending state", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        admins: [{ id: "1", email: "a@b.com", display_name: "Ada", created_at: "2026-01-01" }],
      }),
    })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Cannot delete the last remaining admin" }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager />);
  await screen.findByText("Ada");

  fireEvent.click(screen.getByText("Delete"));

  await waitFor(() =>
    expect(toastErrorMock).toHaveBeenCalledWith("Cannot delete the last remaining admin")
  );
  expect(screen.getByRole("button", { name: "Delete" })).not.toBeDisabled();
});

test("does not delete when the confirmation is dismissed", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      admins: [{ id: "1", email: "a@b.com", display_name: "Ada", created_at: "2026-01-01" }],
    }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager />);
  await screen.findByText("Ada");
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

  fireEvent.click(screen.getByText("Delete"));

  // Only the initial GET on mount; the DELETE never fired.
  await waitFor(() => expect(window.confirm).toHaveBeenCalled());
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/admins");
});

test("attaches extraHeaders to every request", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ admins: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager extraHeaders={{ "x-admin-setup-key": "secret" }} />);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][1]).toEqual(
    expect.objectContaining({ headers: { "x-admin-setup-key": "secret" } })
  );
});
