"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type GalleryRecord = {
  id: string;
  media_type: "image" | "video";
  url: string;
  duration_seconds: number | null;
  caption: string;
  storage_path: string;
  created_at: string;
};

type SignedUpload = {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
};

type GalleryManagerProps = {
  extraHeaders?: Record<string, string>;
};

async function uploadToCloudinary(file: File, signed: SignedUpload, resourceType: "image" | "video") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload to Cloudinary failed");
  }

  return response.json() as Promise<{ secure_url: string; public_id: string; duration?: number }>;
}

export function GalleryManager({ extraHeaders = {} }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/admin/gallery", { headers: extraHeaders });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to load gallery items");
      setStatus("error");
      return;
    }
    const body = await response.json();
    setItems(body.items);
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    queueMicrotask(loadItems);
  }, [loadItems]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setErrorMessage("");

    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    try {
      const signResponse = await fetch("/api/admin/gallery/sign", { headers: extraHeaders });
      if (!signResponse.ok) {
        throw new Error("Failed to sign upload");
      }
      const signed = (await signResponse.json()) as SignedUpload;

      const uploaded = await uploadToCloudinary(file, signed, mediaType);

      const createResponse = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...extraHeaders },
        body: JSON.stringify({
          url: uploaded.secure_url,
          storagePath: uploaded.public_id,
          mediaType,
          durationSeconds: uploaded.duration ?? undefined,
          caption,
        }),
      });
      if (!createResponse.ok) {
        const body = await createResponse.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save gallery item");
      }
      const createdBody = await createResponse.json();

      setFile(null);
      setCaption("");
      if (createdBody.item) {
        setItems((previous) => [...previous, createdBody.item as GalleryRecord]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this gallery item? This cannot be undone.")) {
      return;
    }
    const response = await fetch(`/api/admin/gallery/${id}`, {
      method: "DELETE",
      headers: extraHeaders,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to delete gallery item");
      return;
    }
    await loadItems();
  }

  function startEditing(item: GalleryRecord) {
    setEditingId(item.id);
    setEditingCaption(item.caption);
  }

  async function saveCaption(id: string) {
    const response = await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ caption: editingCaption }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to update caption");
      return;
    }
    setEditingId(null);
    await loadItems();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleUpload} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-body">
          Photo or video
          <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-body">
          Caption
          <input
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        {errorMessage && (
          <p role="alert" className="text-sm text-brand-red">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !file}
          className="bg-brand-green px-6 py-3 text-sm font-body font-medium text-ink-inverse disabled:opacity-50"
        >
          {submitting ? "Uploading..." : "Upload"}
        </button>
      </form>

      {status === "loading" && <p>Loading gallery...</p>}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3">
            <div className="flex flex-1 items-center gap-3">
              <span className="text-sm text-ink/60">{item.media_type}</span>
              {editingId === item.id ? (
                <input
                  type="text"
                  value={editingCaption}
                  onChange={(event) => setEditingCaption(event.target.value)}
                  className="flex-1 border border-ink/20 px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-body">{item.caption || "(no caption)"}</p>
              )}
            </div>
            <div className="flex gap-3">
              {editingId === item.id ? (
                <button type="button" onClick={() => saveCaption(item.id)} className="text-sm underline">
                  Save
                </button>
              ) : (
                <button type="button" onClick={() => startEditing(item)} className="text-sm underline">
                  Edit caption
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-sm text-brand-red underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
