import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const successMock = vi.fn();
const errorMock = vi.fn();
vi.mock("./ToastProvider", () => ({
  useToast: () => ({ success: successMock, error: errorMock }),
}));

import { ContentEditor } from "./ContentEditor";
import type { Field } from "@/content/schema-types";

const schema: Field = { type: "group", label: "Home", fields: { headline: { type: "text", label: "Headline" } } };

beforeEach(() => {
  successMock.mockReset();
  errorMock.mockReset();
});

test("loads and displays the current content", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ content: { headline: "Current headline" } }),
  }) as unknown as typeof fetch;

  render(<ContentEditor contentKey="home" schema={schema} label="Home" />);
  expect(await screen.findByDisplayValue("Current headline")).toBeInTheDocument();
});

test("shows a load error via toast when the fetch fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Unauthorized" }) }) as unknown as typeof fetch;

  render(<ContentEditor contentKey="home" schema={schema} label="Home" />);
  await waitFor(() => expect(errorMock).toHaveBeenCalledWith("Unauthorized"));
});

test("saves the edited content and shows a success toast", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (!init || init.method === undefined) {
      return Promise.resolve({ ok: true, json: async () => ({ content: { headline: "Current headline" } }) });
    }
    if (init.method === "PATCH") {
      return Promise.resolve({ ok: true, json: async () => ({ content: { headline: "Edited headline" } }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<ContentEditor contentKey="home" schema={schema} label="Home" />);
  await screen.findByDisplayValue("Current headline");

  fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Edited headline" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(successMock).toHaveBeenCalledWith("Home saved."));
  const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
  expect(patchCall![0]).toBe("/api/admin/content/home");
  expect(JSON.parse((patchCall![1] as RequestInit).body as string)).toEqual({
    content: { headline: "Edited headline" },
  });
});

test("a rejected fetch on initial load shows a Retry button, which re-fetches on click", async () => {
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce(new TypeError("Failed to fetch"))
    .mockResolvedValueOnce({ ok: true, json: async () => ({ content: { headline: "Current headline" } }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<ContentEditor contentKey="home" schema={schema} label="Home" />);

  const retryButton = await screen.findByRole("button", { name: "Retry" });
  await waitFor(() =>
    expect(errorMock).toHaveBeenCalledWith("Couldn't reach the server. Check your connection and try again.")
  );

  fireEvent.click(retryButton);

  expect(await screen.findByDisplayValue("Current headline")).toBeInTheDocument();
});

test("a rejected fetch during save calls the error toast and re-enables the Save button", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (!init || init.method === undefined) {
      return Promise.resolve({ ok: true, json: async () => ({ content: { headline: "Current headline" } }) });
    }
    if (init.method === "PATCH") {
      return Promise.reject(new TypeError("Failed to fetch"));
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<ContentEditor contentKey="home" schema={schema} label="Home" />);
  await screen.findByDisplayValue("Current headline");

  fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Attempted edit" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() =>
    expect(errorMock).toHaveBeenCalledWith("Couldn't reach the server. Your edits are still here — try saving again.")
  );

  const saveButton = screen.getByRole("button", { name: "Save" });
  expect(saveButton).not.toBeDisabled();
});

test("shows a save error via toast and keeps the attempted edit on screen", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (!init || init.method === undefined) {
      return Promise.resolve({ ok: true, json: async () => ({ content: { headline: "Current headline" } }) });
    }
    return Promise.resolve({ ok: false, json: async () => ({ error: "Save failed" }) });
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<ContentEditor contentKey="home" schema={schema} label="Home" />);
  await screen.findByDisplayValue("Current headline");

  fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Attempted edit" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(errorMock).toHaveBeenCalledWith("Save failed"));
  expect(screen.getByLabelText("Headline")).toHaveValue("Attempted edit");
});
