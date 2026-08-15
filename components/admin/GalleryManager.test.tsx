import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GalleryManager } from "./GalleryManager";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock("./ToastProvider", () => ({
  useToast: () => ({ success: toastSuccessMock, error: toastErrorMock }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
});

test("shows a skeleton while the initial list is loading", () => {
  global.fetch = vi.fn().mockReturnValue(new Promise(() => {})) as unknown as typeof fetch;
  render(<GalleryManager />);
  expect(screen.getByLabelText("Loading gallery")).toBeInTheDocument();
});

test("loads and displays gallery items with real thumbnails on mount", async () => {
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
          posterUrl: null,
        },
        {
          id: "2",
          media_type: "video",
          url: "https://x/v.mp4",
          duration_seconds: 10,
          caption: "Launch",
          storage_path: "oto-gallery/v",
          created_at: "2026-01-02",
          posterUrl: "https://res.cloudinary.com/test-cloud/video/upload/so_0/oto-gallery/v.jpg",
        },
      ],
    }),
  }) as unknown as typeof fetch;

  render(<GalleryManager />);

  expect(await screen.findByText("Rally")).toBeInTheDocument();
  // Image items get their own url as the thumbnail; videos get their
  // server-derived posterUrl. Both are next/image, so alt-text presence is
  // the stable assertion (matching the convention used by GalleryItemCard).
  expect(screen.getByAltText("Rally")).toBeInTheDocument();
  expect(screen.getByAltText("Launch")).toBeInTheDocument();
});

test("shows an empty state when there are no items", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items: [] }),
  }) as unknown as typeof fetch;

  render(<GalleryManager />);
  expect(await screen.findByText("No gallery items yet.")).toBeInTheDocument();
});

test("shows the load error when the list request fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Unauthorized" }),
  }) as unknown as typeof fetch;

  render(<GalleryManager />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
});

test("uploads a file: signs, uploads to Cloudinary, creates the row, toasts success, and appends it locally", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/admin/gallery" && (!init || init.method === undefined)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "1",
              media_type: "image",
              url: "https://x/old.jpg",
              duration_seconds: null,
              caption: "Existing rally photo",
              storage_path: "oto-gallery/old",
              created_at: "2026-01-01",
              posterUrl: null,
            },
          ],
        }),
      });
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
      return Promise.resolve({
        ok: true,
        json: async () => ({
          item: {
            id: "2",
            media_type: "image",
            url: "https://res.cloudinary.com/test-cloud/image/upload/oto-gallery/photo.jpg",
            duration_seconds: null,
            caption: "Campaign stop",
            storage_path: "oto-gallery/photo",
            created_at: "2026-02-01",
            posterUrl: null,
          },
        }),
      });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Existing rally photo");

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

  await screen.findByText("Campaign stop");
  const listItems = screen.getAllByRole("listitem");
  expect(listItems).toHaveLength(2);
  expect(listItems[0]).toHaveTextContent("Campaign stop");
  expect(listItems[1]).toHaveTextContent("Existing rally photo");
  expect(toastSuccessMock).toHaveBeenCalledWith("Uploaded.");
});

test("shows the upload error inline, not as a toast, so it stays next to the form", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/admin/gallery" && (!init || init.method === undefined)) {
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
    }
    if (url === "/api/admin/gallery/sign") {
      return Promise.resolve({ ok: false, json: async () => ({}) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

  const file = new File(["fake-image-bytes"], "photo.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("Photo or video"), { target: { files: [file] } });
  fireEvent.click(screen.getByText("Upload"));

  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to sign upload");
  expect(toastSuccessMock).not.toHaveBeenCalled();
  expect(toastErrorMock).not.toHaveBeenCalled();
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
          posterUrl: null,
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

test("shows a per-item pending state while deleting, and toasts success", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  let resolveDelete: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => {};
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
              posterUrl: null,
            },
          ],
        }),
      });
    }
    if (url === "/api/admin/gallery/1" && init?.method === "DELETE") {
      return new Promise((resolve) => {
        resolveDelete = resolve;
      });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Rally");
  fireEvent.click(screen.getByText("Delete"));

  expect(await screen.findByRole("button", { name: "Deleting..." })).toBeDisabled();

  resolveDelete({ ok: true, json: async () => ({ ok: true }) });
  await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Deleted."));
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
              posterUrl: null,
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

test("toasts an error and clears the pending state when delete fails", async () => {
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
              posterUrl: null,
            },
          ],
        }),
      });
    }
    if (url === "/api/admin/gallery/1" && init?.method === "DELETE") {
      return Promise.resolve({ ok: false, json: async () => ({ error: "Gallery item not found" }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Rally");
  fireEvent.click(screen.getByText("Delete"));

  await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("Gallery item not found"));
  expect(screen.getByRole("button", { name: "Delete" })).not.toBeDisabled();
});

test("edits and saves a caption, showing a pending state and a success toast", async () => {
  let resolvePatch: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => {};
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
              posterUrl: null,
            },
          ],
        }),
      });
    }
    if (url === "/api/admin/gallery/1" && init?.method === "PATCH") {
      return new Promise((resolve) => {
        resolvePatch = resolve;
      });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Old caption");

  fireEvent.click(screen.getByText("Edit caption"));
  fireEvent.change(screen.getByDisplayValue("Old caption"), { target: { value: "New caption" } });
  fireEvent.click(screen.getByText("Save"));

  expect(await screen.findByRole("button", { name: "Saving..." })).toBeDisabled();

  resolvePatch({ ok: true, json: async () => ({ item: { id: "1", caption: "New caption" } }) });

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
  expect(toastSuccessMock).toHaveBeenCalledWith("Caption updated.");
});

test("toasts an error when saving a caption fails", async () => {
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
              posterUrl: null,
            },
          ],
        }),
      });
    }
    if (url === "/api/admin/gallery/1" && init?.method === "PATCH") {
      return Promise.resolve({ ok: false, json: async () => ({ error: "Gallery item not found" }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Old caption");

  fireEvent.click(screen.getByText("Edit caption"));
  fireEvent.change(screen.getByDisplayValue("Old caption"), { target: { value: "New caption" } });
  fireEvent.click(screen.getByText("Save"));

  await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("Gallery item not found"));
});
