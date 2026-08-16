"use client";

import type { Field } from "@/content/schema-types";

type SchemaFormProps = {
  schema: Field;
  value: unknown;
  onChange: (next: unknown) => void;
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
}: {
  field: Field;
  path: string;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
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

  // Remaining field types (optional, image) are added in later tasks.
  return null;
}

export function SchemaForm({ schema, value, onChange }: SchemaFormProps) {
  if (schema.type !== "group") {
    return <FieldControl field={schema} path="root" value={value} onChange={onChange} />;
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
        />
      ))}
    </div>
  );
}
