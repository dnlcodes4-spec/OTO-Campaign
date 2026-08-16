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

  // Remaining field types (list, optional, image) are added in later tasks.
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
