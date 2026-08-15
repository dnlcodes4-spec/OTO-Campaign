import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DevAdminSetup } from "./DevAdminSetup";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("does not call the admins API until the setup key is submitted", () => {
  const fetchMock = vi.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  render(<DevAdminSetup />);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Setup key")).toBeInTheDocument();
});

test("sends the entered setup key as a header once unlocked", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ admins: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<DevAdminSetup />);
  fireEvent.change(screen.getByLabelText("Setup key"), { target: { value: "my-secret" } });
  fireEvent.click(screen.getByText("Continue"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [, options] = fetchMock.mock.calls[0];
  expect(options.headers["x-admin-setup-key"]).toBe("my-secret");
});
