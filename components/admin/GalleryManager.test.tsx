import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GalleryManager } from "./GalleryManager";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("loads and displays gallery items on mount", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [
        {
          id: "1",
          media_type: "image",
          url: "https://x/y.jpg",
          duration_seconds: null,
          caption: "Rally",
          storage_path: "oto-gallery/y",
          created_at: "2026-01-01",
        },
      ],
    }),
  }) as unknown as typeof fetch;

  render(<GalleryManager />);
  expect(await screen.findByText("Rally")).toBeInTheDocument();
});

test("shows the load error when the list request fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Unauthorized" }),
  }) as unknown as typeof fetch;

  render(<GalleryManager />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
});

test("uploads a file: signs, uploads to Cloudinary, creates the row, then reloads", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/admin/gallery" && (!init || init.method === undefined)) {
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
    }
    if (url === "/api/admin/gallery/sign") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          signature: "sig",
          timestamp: 123,
          folder: "oto-gallery",
          cloudName: "test-cloud",
          apiKey: "test-key",
        }),
      });
    }
    if (url.startsWith("https://api.cloudinary.com/")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          secure_url: "https://res.cloudinary.com/test-cloud/image/upload/oto-gallery/photo.jpg",
          public_id: "oto-gallery/photo",
        }),
      });
    }
    if (url === "/api/admin/gallery" && init?.method === "POST") {
      return Promise.resolve({ ok: true, json: async () => ({ item: { id: "2" } }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

  const file = new File(["fake-image-bytes"], "photo.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("Photo or video"), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText("Caption"), { target: { value: "Campaign stop" } });
  fireEvent.click(screen.getByText("Upload"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

  const cloudinaryCall = fetchMock.mock.calls.find(([url]) => String(url).startsWith("https://api.cloudinary.com/"));
  expect(cloudinaryCall?.[0]).toBe("https://api.cloudinary.com/v1_1/test-cloud/image/upload");

  const createCall = fetchMock.mock.calls.find(
    ([url, init]) => url === "/api/admin/gallery" && init?.method === "POST"
  );
  expect(createCall).toBeTruthy();
  const createBody = JSON.parse((createCall![1] as RequestInit).body as string);
  expect(createBody).toMatchObject({
    url: "https://res.cloudinary.com/test-cloud/image/upload/oto-gallery/photo.jpg",
    storagePath: "oto-gallery/photo",
    mediaType: "image",
    caption: "Campaign stop",
  });
});

test("does not delete when the confirmation is cancelled", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [
        {
          id: "1",
          media_type: "image",
          url: "https://x/y.jpg",
          duration_seconds: null,
          caption: "Rally",
          storage_path: "oto-gallery/y",
          created_at: "2026-01-01",
        },
      ],
    }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Rally");
  fireEvent.click(screen.getByText("Delete"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
});

test("deletes a gallery item after confirmation", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/admin/gallery" && (!init || init.method === undefined)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "1",
              media_type: "image",
              url: "https://x/y.jpg",
              duration_seconds: null,
              caption: "Rally",
              storage_path: "oto-gallery/y",
              created_at: "2026-01-01",
            },
          ],
        }),
      });
    }
    if (url === "/api/admin/gallery/1" && init?.method === "DELETE") {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Rally");
  fireEvent.click(screen.getByText("Delete"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
});

test("edits and saves a caption", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/admin/gallery" && (!init || init.method === undefined)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "1",
              media_type: "image",
              url: "https://x/y.jpg",
              duration_seconds: null,
              caption: "Old caption",
              storage_path: "oto-gallery/y",
              created_at: "2026-01-01",
            },
          ],
        }),
      });
    }
    if (url === "/api/admin/gallery/1" && init?.method === "PATCH") {
      return Promise.resolve({ ok: true, json: async () => ({ item: { id: "1", caption: "New caption" } }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Old caption");

  fireEvent.click(screen.getByText("Edit caption"));
  fireEvent.change(screen.getByDisplayValue("Old caption"), { target: { value: "New caption" } });
  fireEvent.click(screen.getByText("Save"));

  await waitFor(() => {
    const patchCall = fetchMock.mock.calls.find(
      ([url, init]) => url === "/api/admin/gallery/1" && init?.method === "PATCH"
    );
    expect(patchCall).toBeTruthy();
  });
  const patchCall = fetchMock.mock.calls.find(
    ([url, init]) => url === "/api/admin/gallery/1" && init?.method === "PATCH"
  );
  const patchBody = JSON.parse((patchCall![1] as RequestInit).body as string);
  expect(patchBody).toEqual({ caption: "New caption" });
});
