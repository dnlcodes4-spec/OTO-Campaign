"use client";

import { useCallback, useEffect, useState } from "react";
import { SchemaForm } from "./SchemaForm";
import { useToast } from "./ToastProvider";
import type { Field } from "@/content/schema-types";

type ContentEditorProps = {
  contentKey: string;
  schema: Field;
  label: string;
};

async function uploadContentImage(file: File): Promise<{ src: string; alt?: string }> {
  const signResponse = await fetch("/api/admin/gallery/sign?folder=oto-site");
  if (!signResponse.ok) {
    throw new Error("Failed to sign upload");
  }
  const signed = await signResponse.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!uploadResponse.ok) {
    throw new Error("Upload to Cloudinary failed");
  }
  const uploaded = await uploadResponse.json();
  return { src: uploaded.secure_url as string };
}

export function ContentEditor({ contentKey, schema, label }: ContentEditorProps) {
  const toast = useToast();
  const [value, setValue] = useState<unknown>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/content/${contentKey}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to load content");
      setStatus("error");
      return;
    }
    const body = await response.json();
    setValue(body.content);
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function handleSave() {
    setSubmitting(true);
    const response = await fetch(`/api/admin/content/${contentKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value }),
    });
    setSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to save content");
      return;
    }

    toast.success(`${label} saved.`);
  }

  if (status === "loading") {
    return <p className="font-body text-sm text-ink/70">Loading {label.toLowerCase()}...</p>;
  }

  if (status === "error") {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <SchemaForm schema={schema} value={value} onChange={setValue} onImageUpload={uploadContentImage} />
      <button
        type="button"
        onClick={handleSave}
        disabled={submitting}
        className="self-start bg-brand-green px-6 py-3 text-sm font-body font-medium text-ink-inverse disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
