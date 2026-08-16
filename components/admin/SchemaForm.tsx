"use client";

import { useState } from "react";
import type { Field } from "@/content/schema-types";

type SchemaFormProps = {
  schema: Field;
  value: unknown;
  onChange: (next: unknown) => void;
  onImageUpload?: (file: File) => Promise<{ src: string; alt?: string }>;
};

function setKey(value: unknown, key: string, next: unknown): Record<string, unknown> {
  const record = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return { ...record, [key]: next };
}

function FieldControl({
  field,
  path,
  value,
  onChange,
  onImageUpload,
}: {
  field: Field;
  path: string;
  value: unknown;
  onChange: (next: unknown) => void;
  onImageUpload?: (file: File) => Promise<{ src: string; alt?: string }>;
}) {
  const [imageUpload, setImageUpload] = useState<{ pending: boolean; error: string }>({
    pending: false,
    error: "",
  });

  if (field.type === "text") {
    return (
      <label className="flex flex-col gap-1 text-sm font-body">
        {field.label}
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="border border-ink/20 px-3 py-2"
        />
      </label>
    );
  }

  if (field.type === "longtext") {
    return (
      <label className="flex flex-col gap-1 text-sm font-body">
        {field.label}
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="border border-ink/20 px-3 py-2"
        />
      </label>
    );
  }

  if (field.type === "group") {
    const groupValue = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    return (
      <fieldset className="flex flex-col gap-4 border border-ink/10 p-4">
        <legend
          role="heading"
          aria-level={3}
          className="px-1 font-display text-base font-semibold text-ink"
        >
          {field.label}
        </legend>
        {Object.entries(field.fields).map(([key, childField]) => (
          <FieldControl
            key={key}
            field={childField}
            path={`${path}.${key}`}
            value={groupValue[key]}
            onChange={(next) => onChange(setKey(groupValue, key, next))}
            onImageUpload={onImageUpload}
          />
        ))}
      </fieldset>
    );
  }

  if (field.type === "list") {
    const items = Array.isArray(value) ? value : [];
    const emptyItem = field.item.type === "group" ? {} : "";
    const itemLabel = field.item.type === "optional" ? field.label : field.item.label;

    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-body font-medium text-ink">{field.label}</p>
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1">
              <FieldControl
                field={field.item}
                path={`${path}[${index}]`}
                value={item}
                onChange={(next) => {
                  const updated = [...items];
                  updated[index] = next;
                  onChange(updated);
                }}
                onImageUpload={onImageUpload}
              />
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="text-sm font-body text-brand-red underline"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, emptyItem])}
          className="self-start border border-ink/20 px-4 py-2 text-sm font-body text-ink transition-colors hover:border-ink/40"
        >
          Add {itemLabel}
        </button>
      </div>
    );
  }

  if (field.type === "optional") {
    const innerLabel = field.field.type === "group" ? field.field.label : (field.field as { label: string }).label;

    if (value === undefined) {
      return (
        <button
          type="button"
          onClick={() => onChange(field.field.type === "group" ? {} : field.field.type === "list" ? [] : "")}
          className="self-start border border-ink/20 px-4 py-2 text-sm font-body text-ink transition-colors hover:border-ink/40"
        >
          Add {innerLabel}
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <FieldControl
          field={field.field}
          path={path}
          value={value}
          onChange={onChange}
          onImageUpload={onImageUpload}
        />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="self-start text-sm font-body text-brand-red underline"
        >
          Remove {innerLabel}
        </button>
      </div>
    );
  }

  if (field.type === "image") {
    const imageValue = (value && typeof value === "object" ? value : { src: "", alt: "" }) as {
      src: string;
      alt: string;
    };

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file || !onImageUpload) return;
      setImageUpload({ pending: true, error: "" });
      try {
        const uploaded = await onImageUpload(file);
        onChange({ ...imageValue, src: uploaded.src, alt: uploaded.alt ?? imageValue.alt });
        setImageUpload({ pending: false, error: "" });
      } catch (error) {
        setImageUpload({
          pending: false,
          error: error instanceof Error ? error.message : "Failed to upload image",
        });
      } finally {
        input.value = "";
      }
    }

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-body font-medium text-ink">{field.label}</p>
        {imageValue.src && (
          // eslint-disable-next-line @next/next/no-img-element -- src may be a Cloudinary URL not covered by next/image's remotePatterns at edit time
          <img src={imageValue.src} alt={imageValue.alt} className="h-32 w-32 object-cover" />
        )}
        <label className="flex flex-col gap-1 text-sm font-body">
          Alt text
          <input
            type="text"
            value={imageValue.alt}
            onChange={(event) => onChange({ ...imageValue, alt: event.target.value })}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        <label
          className={`self-start border border-ink/20 px-4 py-2 text-sm font-body text-ink transition-colors ${
            imageUpload.pending ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-ink/40"
          }`}
        >
          {imageUpload.pending ? "Uploading..." : "Replace image"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={imageUpload.pending}
            className="sr-only"
            aria-label="Replace image"
          />
        </label>
        {imageUpload.error && (
          <p role="alert" className="text-sm text-brand-red">
            {imageUpload.error}
          </p>
        )}
      </div>
    );
  }

  return null;
}

export function SchemaForm({ schema, value, onChange, onImageUpload }: SchemaFormProps) {
  if (schema.type !== "group") {
    return (
      <FieldControl field={schema} path="root" value={value} onChange={onChange} onImageUpload={onImageUpload} />
    );
  }

  const groupValue = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return (
    <div className="flex flex-col gap-6">
      {Object.entries(schema.fields).map(([key, childField]) => (
        <FieldControl
          key={key}
          field={childField}
          path={key}
          value={groupValue[key]}
          onChange={(next) => onChange(setKey(groupValue, key, next))}
          onImageUpload={onImageUpload}
        />
      ))}
    </div>
  );
}
