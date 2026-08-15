"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { useToast } from "./ToastProvider";

type GalleryRecord = {
  id: string;
  media_type: "image" | "video";
  url: string;
  duration_seconds: number | null;
  caption: string;
  storage_path: string;
  created_at: string;
  posterUrl: string | null;
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

const SKELETON_TILES = 8;

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

function GalleryThumbnail({ item }: { item: GalleryRecord }) {
  const [failed, setFailed] = useState(false);
  const src = item.media_type === "image" ? item.url : item.posterUrl;

  if (failed || !src) {
    return (
      <div className="flex h-full items-center justify-center bg-ink/5 font-body text-xs text-ink/40">
        No preview
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={item.caption || `Gallery ${item.media_type}`}
      fill
      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function GalleryManager({ extraHeaders = {} }: GalleryManagerProps) {
  const toast = useToast();
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        setItems((previous) => [createdBody.item as GalleryRecord, ...previous]);
      }
      toast.success("Uploaded.");
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
    setDeletingId(id);
    const response = await fetch(`/api/admin/gallery/${id}`, {
      method: "DELETE",
      headers: extraHeaders,
    });
    setDeletingId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to delete gallery item");
      return;
    }
    toast.success("Deleted.");
    await loadItems();
  }

  function startEditing(item: GalleryRecord) {
    setEditingId(item.id);
    setEditingCaption(item.caption);
  }

  async function saveCaption(id: string) {
    setSavingId(id);
    const response = await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ caption: editingCaption }),
    });
    setSavingId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to update caption");
      return;
    }
    setEditingId(null);
    toast.success("Caption updated.");
    await loadItems();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleUpload} className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1 text-sm font-body">
          <span>Photo or video</span>
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="gallery-file-input"
              className="inline-block cursor-pointer border border-ink/20 px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:border-ink/40"
            >
              Choose file
            </label>
            <span className="font-body text-sm text-ink/60">
              {file ? file.name : "No file chosen"}
            </span>
          </div>
          <input
            id="gallery-file-input"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            aria-label="Photo or video"
            className="sr-only"
          />
        </div>
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

      {status === "loading" ? (
        <div
          aria-busy="true"
          aria-label="Loading gallery"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {Array.from({ length: SKELETON_TILES }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse bg-ink/10" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="font-body text-sm text-ink/60">No gallery items yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col border border-ink/10">
              <div className="relative aspect-square bg-ink/5">
                <GalleryThumbnail item={item} />
                {item.media_type === "video" && (
                  <span className="absolute bottom-1 right-1 bg-ink/70 px-1.5 py-0.5 font-body text-[10px] font-medium uppercase tracking-wide text-ink-inverse">
                    Video
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editingCaption}
                    onChange={(event) => setEditingCaption(event.target.value)}
                    className="border border-ink/20 px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="line-clamp-2 font-body text-sm">{item.caption || "(no caption)"}</p>
                )}
                <div className="mt-auto flex gap-3 text-sm">
                  {editingId === item.id ? (
                    <button
                      type="button"
                      onClick={() => saveCaption(item.id)}
                      disabled={savingId === item.id}
                      className="underline disabled:opacity-50"
                    >
                      {savingId === item.id ? "Saving..." : "Save"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => startEditing(item)} className="underline">
                      Edit caption
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-brand-red underline disabled:opacity-50"
                  >
                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
