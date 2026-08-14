import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminsManager } from "./AdminsManager";

beforeEach(() => {
  vi.restoreAllMocks();
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

test("shows the load error when the list request fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Unauthorized" }),
  }) as unknown as typeof fetch;

  render(<AdminsManager />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
});

test("submits the create form and reloads the list", async () => {
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

test("attaches extraHeaders to every request", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ admins: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager extraHeaders={{ "x-admin-setup-key": "secret" }} />);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][1]).toEqual(
    expect.objectContaining({ headers: { "x-admin-setup-key": "secret" } })
  );
});
