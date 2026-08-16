# Site Content CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every piece of copy across nine of the ten `content/*.ts` files editable from `/admin`, backed by a new `oto_site_content` table, using one recursive schema-driven form component instead of ten bespoke editor pages.

**Architecture:** A recursive `Field` schema type (text, longtext, image, list, group, optional) describes each content file's exact shape. One generic `SchemaForm` client component walks any schema + JSON value together and renders the right controls, including arbitrary nesting (Agenda's items→routes→points). Each content file gets an async `getXContent()` that fetches its `oto_site_content` row and deep-merges it over the existing hardcoded object (now named `xContentDefault`), so the public site never breaks and new fields added later still render. A generic `/admin/content/[key]` page renders `SchemaForm` against a small in-code registry mapping key → {label, schema, defaultValue}.

**Tech Stack:** Next.js 16 (App Router, TypeScript strict), `@supabase/ssr`, Cloudinary (already-configured `lib/cloudinary.ts`), Vitest + Testing Library. Reuses the already-shipped `ToastProvider`/`useToast` (`components/admin/ToastProvider.tsx`) and `AdminNav` (`components/admin/AdminNav.tsx`) — the toast/loading/error/pending dashboard refinement this spec originally also covered is already implemented (commits `72f10a9`, `9c6848b`, `734613f`, `c955d22`) and is NOT part of this plan.

**Spec:** `docs/superpowers/specs/2026-08-16-site-content-cms-design.md`

## Global Constraints

- Reuse `authorizeAdminRequest` (`lib/admin/authorize.ts`) for every write path. Do not reimplement gating logic.
- Same Supabase project as every other OTO table (project id `jgemycpdcmoebigmgorq`); `oto_site_content` is `oto_`-prefixed, never touches Atunluto's own `site_content` table.
- TypeScript strict mode and ESLint (including `eslint-plugin-react-hooks` v7 — any `useEffect` that sets state must route through `queueMicrotask(...)`, per the pattern in `AdminsManager.tsx`) are the baseline gate.
- Any thrown error from Supabase client construction or a `cookies()`-touching call must be checked with `isNextInternalSignal` (`lib/next-internal-errors.ts`) before being swallowed — re-throw if it's a Next.js internal signal.
- Tests use Vitest + Testing Library, matching `AdminsManager.test.tsx` / `GalleryManager.test.tsx` conventions: `vi.mock` calls before imports, `beforeEach` resets.
- Brand tokens only (`brand-green`, `brand-red`, `brand-gold`, `ink`, `ink-inverse`, `surface`), no hardcoded colors, no em dashes in copy.
- No content field becomes rich text; every field is plain text or plain paragraphs.
- `content/watch.ts`'s `video` field is excluded from the schema-editable surface; its existing swap-in design is untouched by this plan.

---

### Task 1: Content schema field types

**Files:**
- Create: `content/schema-types.ts`

**Interfaces:**
- Produces: `Field` (discriminated union type). Consumed by every later task.

- [ ] **Step 1: Write the type**

`content/schema-types.ts`:
```ts
export type Field =
  | { type: "text"; label: string }
  | { type: "longtext"; label: string }
  | { type: "image"; label: string }
  | { type: "list"; label: string; item: Field }
  | { type: "group"; label: string; fields: Record<string, Field> }
  | { type: "optional"; field: Field };
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors referencing `schema-types.ts` (pure type file, nothing consumes it yet).

- [ ] **Step 3: Commit**

```bash
git add content/schema-types.ts
git commit -m "feat: add the recursive content schema field type"
```

---

### Task 2: SchemaForm - text, longtext, and nested groups

**Files:**
- Create: `components/admin/SchemaForm.tsx`
- Test: `components/admin/SchemaForm.test.tsx`

**Interfaces:**
- Consumes: `Field` from `content/schema-types.ts` (Task 1).
- Produces: `SchemaForm({ schema, value, onChange }: { schema: Field; value: unknown; onChange: (next: unknown) => void })` React component. Consumed by Tasks 3-5 (extended in place) and Task 11 (content editor page).

- [ ] **Step 1: Write the failing test**

`components/admin/SchemaForm.test.tsx`:
```tsx
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SchemaForm } from "./SchemaForm";
import type { Field } from "@/content/schema-types";

describe("SchemaForm", () => {
  test("renders a text field bound to its value and calls onChange on edit", () => {
    const schema: Field = { type: "group", label: "Home", fields: { headline: { type: "text", label: "Headline" } } };
    const onChange = vi.fn();
    render(<SchemaForm schema={schema} value={{ headline: "Old headline" }} onChange={onChange} />);

    const input = screen.getByLabelText("Headline");
    expect(input).toHaveValue("Old headline");
    fireEvent.change(input, { target: { value: "New headline" } });
    expect(onChange).toHaveBeenCalledWith({ headline: "New headline" });
  });

  test("renders a longtext field as a textarea", () => {
    const schema: Field = { type: "group", label: "Home", fields: { intro: { type: "longtext", label: "Intro" } } };
    const onChange = vi.fn();
    render(<SchemaForm schema={schema} value={{ intro: "Some body copy" }} onChange={onChange} />);

    const textarea = screen.getByLabelText("Intro");
    expect(textarea.tagName).toBe("TEXTAREA");
    fireEvent.change(textarea, { target: { value: "Edited body copy" } });
    expect(onChange).toHaveBeenCalledWith({ intro: "Edited body copy" });
  });

  test("renders a nested group under its own heading and edits only its own field", () => {
    const schema: Field = {
      type: "group",
      label: "About",
      fields: {
        name: { type: "text", label: "Name" },
        portrait: {
          type: "group",
          label: "Portrait",
          fields: { alt: { type: "text", label: "Alt text" } },
        },
      },
    };
    const onChange = vi.fn();
    render(
      <SchemaForm
        schema={schema}
        value={{ name: "OTO", portrait: { alt: "Old alt" } }}
        onChange={onChange}
      />
    );

    expect(screen.getByRole("heading", { name: "Portrait" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Alt text"), { target: { value: "New alt" } });
    expect(onChange).toHaveBeenCalledWith({ name: "OTO", portrait: { alt: "New alt" } });
  });

  test("a top-level group schema renders its own fields without an extra heading wrapper", () => {
    const schema: Field = { type: "group", label: "Home", fields: { headline: { type: "text", label: "Headline" } } };
    render(<SchemaForm schema={schema} value={{ headline: "x" }} onChange={vi.fn()} />);
    expect(screen.queryByRole("heading", { name: "Home" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/admin/SchemaForm.test.tsx`
Expected: FAIL, "Cannot find module './SchemaForm'"

- [ ] **Step 3: Implement**

`components/admin/SchemaForm.tsx`:
```tsx
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
        <legend className="px-1 font-display text-base font-semibold text-ink">{field.label}</legend>
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/admin/SchemaForm.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add content/schema-types.ts components/admin/SchemaForm.tsx components/admin/SchemaForm.test.tsx
git commit -m "feat: add SchemaForm with text, longtext, and nested group fields"
```

---

### Task 3: SchemaForm - list fields (string lists and repeating groups)

**Files:**
- Modify: `components/admin/SchemaForm.tsx`
- Modify: `components/admin/SchemaForm.test.tsx`

**Interfaces:**
- Produces: `list` field rendering (item add/remove/reorder), for both `item: { type: "text" }` (a plain string list) and `item: { type: "group", ... }` (a repeating section). Consumed by Task 11 and every content schema that has a list (all nine).

- [ ] **Step 1: Write the failing tests**

Add to `components/admin/SchemaForm.test.tsx` (keep existing tests):
```tsx
test("renders a string list with one input per item, and can add a new item", () => {
  const schema: Field = {
    type: "group",
    label: "About",
    fields: { record: { type: "list", label: "Record", item: { type: "text", label: "Point" } } },
  };
  const onChange = vi.fn();
  render(<SchemaForm schema={schema} value={{ record: ["First point", "Second point"] }} onChange={onChange} />);

  const inputs = screen.getAllByLabelText("Point");
  expect(inputs).toHaveLength(2);
  expect(inputs[0]).toHaveValue("First point");

  fireEvent.click(screen.getByRole("button", { name: "Add Point" }));
  expect(onChange).toHaveBeenCalledWith({ record: ["First point", "Second point", ""] });
});

test("removes a string list item", () => {
  const schema: Field = {
    type: "group",
    label: "About",
    fields: { record: { type: "list", label: "Record", item: { type: "text", label: "Point" } } },
  };
  const onChange = vi.fn();
  render(<SchemaForm schema={schema} value={{ record: ["First point", "Second point"] }} onChange={onChange} />);

  fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
  expect(onChange).toHaveBeenCalledWith({ record: ["Second point"] });
});

test("edits a specific item within a string list", () => {
  const schema: Field = {
    type: "group",
    label: "About",
    fields: { record: { type: "list", label: "Record", item: { type: "text", label: "Point" } } },
  };
  const onChange = vi.fn();
  render(<SchemaForm schema={schema} value={{ record: ["First point", "Second point"] }} onChange={onChange} />);

  fireEvent.change(screen.getAllByLabelText("Point")[1], { target: { value: "Edited second" } });
  expect(onChange).toHaveBeenCalledWith({ record: ["First point", "Edited second"] });
});

test("renders a repeating group list (list of objects), each with its own sub-fields", () => {
  const schema: Field = {
    type: "group",
    label: "About",
    fields: {
      education: {
        type: "list",
        label: "Education",
        item: {
          type: "group",
          label: "Entry",
          fields: {
            school: { type: "text", label: "School" },
            period: { type: "text", label: "Period" },
          },
        },
      },
    },
  };
  const onChange = vi.fn();
  render(
    <SchemaForm
      schema={schema}
      value={{ education: [{ school: "FUT Minna", period: "1992/93" }] }}
      onChange={onChange}
    />
  );

  expect(screen.getByDisplayValue("FUT Minna")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("School"), { target: { value: "Edited school" } });
  expect(onChange).toHaveBeenCalledWith({ education: [{ school: "Edited school", period: "1992/93" }] });
});

test("adding an item to a repeating group list adds an empty group, not an empty string", () => {
  const schema: Field = {
    type: "group",
    label: "About",
    fields: {
      education: {
        type: "list",
        label: "Education",
        item: { type: "group", label: "Entry", fields: { school: { type: "text", label: "School" } } },
      },
    },
  };
  const onChange = vi.fn();
  render(<SchemaForm schema={schema} value={{ education: [] }} onChange={onChange} />);

  fireEvent.click(screen.getByRole("button", { name: "Add Entry" }));
  expect(onChange).toHaveBeenCalledWith({ education: [{}] });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/admin/SchemaForm.test.tsx`
Expected: FAIL, new tests find no "Add Point"/"Remove" buttons (list renders nothing, since `list` falls through to the `return null` placeholder from Task 2).

- [ ] **Step 3: Implement**

In `components/admin/SchemaForm.tsx`, add a `list` branch to `FieldControl`, above the `// Remaining field types` comment:
```tsx
  if (field.type === "list") {
    const items = Array.isArray(value) ? value : [];
    const emptyItem = field.item.type === "group" ? {} : "";

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
          Add {field.item.type === "group" ? field.item.label : field.label.replace(/s$/, "")}
        </button>
      </div>
    );
  }
```

Note the "Add" button label: for a `group` item it reads `Add {item.label}` (e.g. "Add Entry", "Add Point" from the item field's own label since `item: { type: "text", label: "Point" }` names itself "Point"). Both test cases already use this exact wording ("Add Point", "Add Entry").

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/admin/SchemaForm.test.tsx`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add components/admin/SchemaForm.tsx components/admin/SchemaForm.test.tsx
git commit -m "feat: add list fields to SchemaForm, covering both string lists and repeating groups"
```

---

### Task 4: SchemaForm - optional fields

**Files:**
- Modify: `components/admin/SchemaForm.tsx`
- Modify: `components/admin/SchemaForm.test.tsx`

**Interfaces:**
- Produces: `optional` field rendering (present-or-absent toggle). Consumed by the Agenda content schema (Task 15), the only content file needing it.

- [ ] **Step 1: Write the failing tests**

Add to `components/admin/SchemaForm.test.tsx`:
```tsx
test("an absent optional field shows an add control instead of its inner field", () => {
  const schema: Field = {
    type: "group",
    label: "Agenda item",
    fields: { note: { type: "optional", field: { type: "text", label: "Note" } } },
  };
  render(<SchemaForm schema={schema} value={{}} onChange={vi.fn()} />);

  expect(screen.queryByLabelText("Note")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add Note" })).toBeInTheDocument();
});

test("adding an optional field reveals its inner control with an empty value", () => {
  const schema: Field = {
    type: "group",
    label: "Agenda item",
    fields: { note: { type: "optional", field: { type: "text", label: "Note" } } },
  };
  const onChange = vi.fn();
  render(<SchemaForm schema={schema} value={{}} onChange={onChange} />);

  fireEvent.click(screen.getByRole("button", { name: "Add Note" }));
  expect(onChange).toHaveBeenCalledWith({ note: "" });
});

test("a present optional field renders its inner control plus a remove-field control", () => {
  const schema: Field = {
    type: "group",
    label: "Agenda item",
    fields: { note: { type: "optional", field: { type: "text", label: "Note" } } },
  };
  const onChange = vi.fn();
  render(<SchemaForm schema={schema} value={{ note: "A footnote" }} onChange={onChange} />);

  expect(screen.getByLabelText("Note")).toHaveValue("A footnote");
  fireEvent.click(screen.getByRole("button", { name: "Remove Note" }));
  expect(onChange).toHaveBeenCalledWith({});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/admin/SchemaForm.test.tsx`
Expected: FAIL, "Add Note" button not found (optional falls through to `return null`).

- [ ] **Step 3: Implement**

In `components/admin/SchemaForm.tsx`, add an `optional` branch to `FieldControl`:
```tsx
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
        <FieldControl field={field.field} path={path} value={value} onChange={onChange} />
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
```

`setKey` (used by the parent `group`/`list` calling this field's `onChange`) already spreads the value object and overwrites the key — calling `onChange(undefined)` sets that key's value to `undefined` in the parent object. That leaves the key present with an `undefined` value rather than deleting it outright; this is fine for the in-memory form state (it renders as absent per the `value === undefined` check above) and gets dropped naturally when the value is serialized to JSON on save (`JSON.stringify` omits `undefined` values), matching the JSONB column's storage.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/admin/SchemaForm.test.tsx`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add components/admin/SchemaForm.tsx components/admin/SchemaForm.test.tsx
git commit -m "feat: add optional fields to SchemaForm"
```

---

### Task 5: SchemaForm - image fields with upload delegation

**Files:**
- Modify: `components/admin/SchemaForm.tsx`
- Modify: `components/admin/SchemaForm.test.tsx`

**Interfaces:**
- Consumes: none new (delegates the actual upload to a caller-supplied callback, keeping SchemaForm decoupled from Cloudinary specifics).
- Produces: `image` field rendering, and a new `SchemaFormProps.onImageUpload?: (file: File) => Promise<{ src: string; alt?: string }>` prop. Consumed by Task 11 (content editor page), which implements the actual sign/upload logic.

- [ ] **Step 1: Write the failing tests**

Add to `components/admin/SchemaForm.test.tsx`:
```tsx
test("renders the current image and an alt text field", () => {
  const schema: Field = {
    type: "group",
    label: "Home",
    fields: { portrait: { type: "image", label: "Portrait" } },
  };
  render(
    <SchemaForm
      schema={schema}
      value={{ portrait: { src: "/images/oto-native.png", alt: "OTO in agbada" } }}
      onChange={vi.fn()}
    />
  );

  expect(screen.getByRole("img", { name: "OTO in agbada" })).toHaveAttribute("src", "/images/oto-native.png");
  expect(screen.getByLabelText("Alt text")).toHaveValue("OTO in agbada");
});

test("editing alt text updates only the alt field", () => {
  const schema: Field = {
    type: "group",
    label: "Home",
    fields: { portrait: { type: "image", label: "Portrait" } },
  };
  const onChange = vi.fn();
  render(
    <SchemaForm
      schema={schema}
      value={{ portrait: { src: "/images/oto-native.png", alt: "Old alt" } }}
      onChange={onChange}
    />
  );

  fireEvent.change(screen.getByLabelText("Alt text"), { target: { value: "New alt" } });
  expect(onChange).toHaveBeenCalledWith({ portrait: { src: "/images/oto-native.png", alt: "New alt" } });
});

test("choosing a replacement file calls onImageUpload and updates src on success", async () => {
  const schema: Field = {
    type: "group",
    label: "Home",
    fields: { portrait: { type: "image", label: "Portrait" } },
  };
  const onChange = vi.fn();
  const onImageUpload = vi.fn().mockResolvedValue({ src: "https://res.cloudinary.com/x/new.jpg" });
  render(
    <SchemaForm
      schema={schema}
      value={{ portrait: { src: "/images/oto-native.png", alt: "OTO" } }}
      onChange={onChange}
      onImageUpload={onImageUpload}
    />
  );

  const file = new File(["fake-bytes"], "new-portrait.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("Replace image"), { target: { files: [file] } });

  await waitFor(() => expect(onImageUpload).toHaveBeenCalledWith(file));
  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith({
      portrait: { src: "https://res.cloudinary.com/x/new.jpg", alt: "OTO" },
    })
  );
});
```

Add `waitFor` to the existing `@testing-library/react` import at the top of the file:
```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/admin/SchemaForm.test.tsx`
Expected: FAIL, no `img` role or "Alt text"/"Replace image" labels found (image falls through to `return null`).

- [ ] **Step 3: Implement**

In `components/admin/SchemaForm.tsx`:

1. Add `onImageUpload` to the props type and thread it through `FieldControl`'s recursive calls (every existing `<FieldControl ... />` invocation, in the `group` branch and the `list` branch, and the top-level render, needs `onImageUpload={onImageUpload}` added):

```tsx
type SchemaFormProps = {
  schema: Field;
  value: unknown;
  onChange: (next: unknown) => void;
  onImageUpload?: (file: File) => Promise<{ src: string; alt?: string }>;
};
```

Update `FieldControl`'s own props type the same way, and pass `onImageUpload` down at every recursive call site (group's field map, list's item render). Update the exported `SchemaForm` function to accept and forward `onImageUpload` too.

2. Add the `image` branch to `FieldControl`, before the final `return null`:
```tsx
  if (field.type === "image") {
    const imageValue = (value && typeof value === "object" ? value : { src: "", alt: "" }) as {
      src: string;
      alt: string;
    };

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      if (!file || !onImageUpload) return;
      const uploaded = await onImageUpload(file);
      onChange({ ...imageValue, src: uploaded.src, alt: uploaded.alt ?? imageValue.alt });
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
        <label className="self-start cursor-pointer border border-ink/20 px-4 py-2 text-sm font-body text-ink transition-colors hover:border-ink/40">
          Replace image
          <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" aria-label="Replace image" />
        </label>
      </div>
    );
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/admin/SchemaForm.test.tsx`
Expected: PASS (15 tests)

- [ ] **Step 5: Commit**

```bash
git add components/admin/SchemaForm.tsx components/admin/SchemaForm.test.tsx
git commit -m "feat: add image fields to SchemaForm with delegated upload"
```

---

### Task 6: `oto_site_content` migration

**Files:**
- Create: `supabase/oto-site-content-schema.sql`

**Interfaces:** Produces: `public.oto_site_content` table. Consumed by Task 7 (loader) and Task 9 (admin API routes).

- [ ] **Step 1: Write the migration file**

`supabase/oto-site-content-schema.sql`:
```sql
-- ═══════════════════════════════════════════════════════════════════════
-- OTO SITE CONTENT
-- Editable copy for the public OTO site, mirroring Atunluto's own
-- site_content table exactly (key/content/updated_at/updated_by), but
-- oto_-prefixed and never touching Atunluto's rows. Applied via the
-- Supabase MCP `apply_migration` tool.
-- ═══════════════════════════════════════════════════════════════════════

create table public.oto_site_content (
  key         text primary key,
  content     jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.oto_admins(id) on delete set null
);

alter table public.oto_site_content enable row level security;

-- Public website: anyone (including anonymous visitors) may read live content.
create policy "oto_site_content_public_read"
  on public.oto_site_content
  for select
  to anon, authenticated
  using (true);
```

- [ ] **Step 2: Apply the migration**

Call `mcp__supabase__apply_migration` with `project_id: "jgemycpdcmoebigmgorq"`, `name: "create_oto_site_content"`, and `query` set to the SQL above.

- [ ] **Step 3: Verify the table exists**

Call `mcp__supabase__list_tables` with `project_id: "jgemycpdcmoebigmgorq"`, `schemas: ["public"]`, `verbose: true`.
Expected: response includes `public.oto_site_content` with the columns above, `rls_enabled: true`, and every other existing table unchanged.

- [ ] **Step 4: Check security advisors**

Call `mcp__supabase__get_advisors` with `project_id: "jgemycpdcmoebigmgorq"`, `type: "security"`.
Expected: no new advisory referencing `oto_site_content`.

- [ ] **Step 5: Commit**

```bash
git add supabase/oto-site-content-schema.sql
git commit -m "feat: add oto_site_content table and public-read RLS policy"
```

---

### Task 7: Site content loader (deep merge + fetch)

**Files:**
- Create: `lib/content/site-content.ts`
- Test: `lib/content/site-content.test.ts`

**Interfaces:**
- Consumes: `createClient` from `lib/supabase/server.ts`, `isNextInternalSignal` from `lib/next-internal-errors.ts`.
- Produces: `getSiteContent<T>(key: string, fallback: T): Promise<T>` and `deepMergeContent<T>(dbValue: unknown, fallback: T): T` (exported so Task 9's API route reuses the same merge logic instead of reimplementing it). Consumed by every content file's `getXContent()` (Tasks 12-20) and the admin content API routes (Task 9).

- [ ] **Step 1: Write the failing test**

`lib/content/site-content.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const createClientMock = vi.fn(async () => ({ from: fromMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

import { getSiteContent } from "./site-content";

beforeEach(() => {
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
  createClientMock.mockReset();
  createClientMock.mockImplementation(async () => ({ from: fromMock }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

test("returns the fallback untouched when no row exists yet", async () => {
  maybeSingleMock.mockResolvedValue({ data: null, error: null });
  const fallback = { headline: "Default headline", intro: "Default intro" };
  await expect(getSiteContent("home", fallback)).resolves.toEqual(fallback);
});

test("returns the fallback untouched on a query error, logging server-side", async () => {
  maybeSingleMock.mockResolvedValue({ data: null, error: new Error("db down") });
  const fallback = { headline: "Default headline" };
  await expect(getSiteContent("home", fallback)).resolves.toEqual(fallback);
  expect(console.error).toHaveBeenCalledWith(expect.stringContaining("oto_site_content"), expect.any(Error));
});

test("lets a Next.js internal signal propagate instead of swallowing it", async () => {
  const signal = Object.assign(new Error("Dynamic server usage"), { digest: "DYNAMIC_SERVER_USAGE" });
  createClientMock.mockImplementation(async () => {
    throw signal;
  });
  await expect(getSiteContent("home", { headline: "x" })).rejects.toBe(signal);
});

test("DB values override the fallback for matching top-level keys", async () => {
  maybeSingleMock.mockResolvedValue({ data: { content: { headline: "Edited headline" } }, error: null });
  const fallback = { headline: "Default headline", intro: "Default intro" };
  await expect(getSiteContent("home", fallback)).resolves.toEqual({
    headline: "Edited headline",
    intro: "Default intro",
  });
});

test("a nested group merges recursively, keeping fallback keys the DB row omits", async () => {
  maybeSingleMock.mockResolvedValue({
    data: { content: { portrait: { alt: "Edited alt" } } },
    error: null,
  });
  const fallback = { portrait: { src: "/images/x.png", alt: "Default alt" } };
  await expect(getSiteContent("home", fallback)).resolves.toEqual({
    portrait: { src: "/images/x.png", alt: "Edited alt" },
  });
});

test("a list/array field from the DB replaces the fallback array wholesale, not merged element by element", async () => {
  maybeSingleMock.mockResolvedValue({
    data: { content: { points: ["Only one edited point"] } },
    error: null,
  });
  const fallback = { points: ["First default point", "Second default point"] };
  await expect(getSiteContent("home", fallback)).resolves.toEqual({ points: ["Only one edited point"] });
});

test("uses the row's own key filter and the oto_site_content table", async () => {
  maybeSingleMock.mockResolvedValue({ data: null, error: null });
  await getSiteContent("agenda", { intro: "x" });
  expect(fromMock).toHaveBeenCalledWith("oto_site_content");
  expect(selectMock).toHaveBeenCalledWith("content");
  expect(eqMock).toHaveBeenCalledWith("key", "agenda");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/content/site-content.test.ts`
Expected: FAIL, "Cannot find module './site-content'"

- [ ] **Step 3: Implement**

`lib/content/site-content.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { isNextInternalSignal } from "@/lib/next-internal-errors";

export function deepMergeContent<T>(dbValue: unknown, fallback: T): T {
  if (dbValue === undefined) return fallback;
  if (dbValue === null || typeof dbValue !== "object" || Array.isArray(dbValue)) {
    return dbValue as T;
  }
  if (fallback === null || typeof fallback !== "object" || Array.isArray(fallback)) {
    return fallback;
  }

  const result: Record<string, unknown> = { ...(fallback as Record<string, unknown>) };
  for (const key of Object.keys(dbValue as Record<string, unknown>)) {
    result[key] = deepMergeContent(
      (dbValue as Record<string, unknown>)[key],
      (fallback as Record<string, unknown>)[key]
    );
  }
  return result as T;
}

export async function getSiteContent<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("oto_site_content")
      .select("content")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error(`Failed to load oto_site_content (${key}):`, error);
      return fallback;
    }

    return deepMergeContent(data.content, fallback);
  } catch (error) {
    if (isNextInternalSignal(error)) throw error;
    console.error(`Failed to load oto_site_content (${key}):`, error);
    return fallback;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/content/site-content.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/content/site-content.ts lib/content/site-content.test.ts
git commit -m "feat: add the deep-merging oto_site_content loader"
```

---

### Task 8: Cloudinary sign route accepts a folder parameter

**Files:**
- Modify: `app/api/admin/gallery/sign/route.ts`
- Modify: `app/api/admin/gallery/sign/route.test.ts`

**Interfaces:**
- Produces: `GET /api/admin/gallery/sign?folder=oto-site` (or `oto-gallery`, or omitted defaulting to `oto-gallery`) returns a signature scoped to that folder. Consumed by Task 11 (content editor's image upload).

- [ ] **Step 1: Write the failing test**

Add to `app/api/admin/gallery/sign/route.test.ts` (keep the existing two tests):
```ts
test("signs an upload for an explicitly requested folder", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  signUploadMock.mockReturnValue({
    signature: "sig",
    timestamp: 123,
    folder: "oto-site",
    cloudName: "test-cloud",
    apiKey: "test-key",
  });
  const response = await GET(new Request("http://localhost/api/admin/gallery/sign?folder=oto-site"));
  expect(response.status).toBe(200);
  expect(signUploadMock).toHaveBeenCalledWith("oto-site");
});

test("rejects a folder outside the known allowlist", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await GET(new Request("http://localhost/api/admin/gallery/sign?folder=not-a-real-folder"));
  expect(response.status).toBe(400);
  expect(signUploadMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/admin/gallery/sign/route.test.ts`
Expected: FAIL — current route ignores query params and always signs `"oto-gallery"`, so the new assertions on `signUploadMock` fail, and there's no 400 path.

- [ ] **Step 3: Implement**

`app/api/admin/gallery/sign/route.ts`:
```ts
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { signUpload } from "@/lib/cloudinary";

const ALLOWED_FOLDERS = ["oto-gallery", "oto-site"];

export async function GET(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") ?? "oto-gallery";

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: "Unknown upload folder" }, { status: 400 });
  }

  return NextResponse.json(signUpload(folder));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/admin/gallery/sign/route.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/gallery/sign/route.ts app/api/admin/gallery/sign/route.test.ts
git commit -m "feat: let the Cloudinary sign route target a specific upload folder"
```

---

### Task 9: Content registry and admin content API routes

**Files:**
- Create: `content/schemas/registry.ts`
- Create: `app/api/admin/content/[key]/route.ts`
- Test: `app/api/admin/content/[key]/route.test.ts`

**Interfaces:**
- Consumes: `Field` from `content/schema-types.ts`, `authorizeAdminRequest`, `createAdminClient` from `lib/supabase/admin.ts`, `deepMergeContent` from `lib/content/site-content.ts` (Task 7 — do not reimplement the merge logic here).
- Produces: `CONTENT_REGISTRY: Record<string, { label: string; schema: Field; defaultValue: unknown }>` (starts with a placeholder `home` entry here; Tasks 12-20 each add their own real entry, replacing the placeholder for `home` in Task 12). `GET /api/admin/content/[key]` returns `{ content }` (merged, same shape the public site sees). `PATCH /api/admin/content/[key]` accepts `{ content }`, upserts, returns `{ content }`. Consumed by Task 10 (content list page) and Task 11 (editor page).

- [ ] **Step 1: Write the placeholder registry**

`content/schemas/registry.ts`:
```ts
import type { Field } from "@/content/schema-types";

/*
 * One entry per editable content file. Each content task (see the CMS
 * implementation plan) adds or replaces its own key here as it ships;
 * this file grows across the whole plan rather than being written once.
 */
export const CONTENT_REGISTRY: Record<string, { label: string; schema: Field; defaultValue: unknown }> = {
  home: {
    label: "Home",
    schema: { type: "group", label: "Home", fields: { headline: { type: "text", label: "Headline" } } },
    defaultValue: { headline: "" },
  },
};
```

- [ ] **Step 2: Write the failing API route test**

`app/api/admin/content/[key]/route.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const upsertMock = vi.fn(() => ({ select: () => ({ single: singleMock }) }));
const singleMock = vi.fn();
const fromMock = vi.fn(() => ({ select: selectMock, upsert: upsertMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import { GET, PATCH } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  upsertMock.mockClear();
  singleMock.mockReset();
  fromMock.mockClear();
});

test("GET rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await GET(new Request("http://localhost/api/admin/content/home"), {
    params: Promise.resolve({ key: "home" }),
  });
  expect(response.status).toBe(401);
});

test("GET rejects a key not in the registry", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await GET(new Request("http://localhost/api/admin/content/not-a-real-key"), {
    params: Promise.resolve({ key: "not-a-real-key" }),
  });
  expect(response.status).toBe(404);
});

test("GET returns the merged content for a known key", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  maybeSingleMock.mockResolvedValue({ data: { content: { headline: "Edited" } }, error: null });
  const response = await GET(new Request("http://localhost/api/admin/content/home"), {
    params: Promise.resolve({ key: "home" }),
  });
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.content).toEqual({ headline: "Edited" });
});

test("PATCH rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", { method: "PATCH", body: JSON.stringify({ content: {} }) }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(401);
});

test("PATCH rejects a key not in the registry", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/not-a-real-key", {
      method: "PATCH",
      body: JSON.stringify({ content: {} }),
    }),
    { params: Promise.resolve({ key: "not-a-real-key" }) }
  );
  expect(response.status).toBe(404);
});

test("PATCH upserts the row and returns the saved content", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  singleMock.mockResolvedValue({ data: { content: { headline: "Saved headline" } }, error: null });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", {
      method: "PATCH",
      body: JSON.stringify({ content: { headline: "Saved headline" } }),
    }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(200);
  expect(upsertMock).toHaveBeenCalledWith({
    key: "home",
    content: { headline: "Saved headline" },
    updated_by: "user-1",
  });
  const body = await response.json();
  expect(body.content).toEqual({ headline: "Saved headline" });
});

test("PATCH returns 500 on a database error", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  singleMock.mockResolvedValue({ data: null, error: new Error("db down") });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", {
      method: "PATCH",
      body: JSON.stringify({ content: { headline: "x" } }),
    }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(500);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run "app/api/admin/content/[key]/route.test.ts"`
Expected: FAIL, "Cannot find module './route'"

- [ ] **Step 4: Implement**

`app/api/admin/content/[key]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTENT_REGISTRY } from "@/content/schemas/registry";
import { deepMergeContent } from "@/lib/content/site-content";

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  const entry = CONTENT_REGISTRY[key];
  if (!entry) {
    return NextResponse.json({ error: "Unknown content key" }, { status: 404 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.from("oto_site_content").select("content").eq("key", key).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: deepMergeContent(data?.content, entry.defaultValue) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  if (!CONTENT_REGISTRY[key]) {
    return NextResponse.json({ error: "Unknown content key" }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body as { content?: unknown };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_site_content")
    .upsert({ key, content, updated_by: authz.actingAdminId })
    .select("content")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: data.content });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run "app/api/admin/content/[key]/route.test.ts"`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add content/schemas/registry.ts "app/api/admin/content/[key]/route.ts" "app/api/admin/content/[key]/route.test.ts"
git commit -m "feat: add the content registry and admin content read/write API"
```

---

### Task 10: Admin content list page

**Files:**
- Create: `app/admin/(protected)/content/page.tsx`
- Test: `app/admin/(protected)/content/page.test.tsx`
- Modify: `components/admin/AdminNav.tsx`
- Modify: `components/admin/AdminNav.test.tsx`

**Interfaces:**
- Consumes: `CONTENT_REGISTRY` from `content/schemas/registry.ts`.
- Produces: `/admin/content`, and a "Content" link in `AdminNav`. Consumed by nobody further (leaf page), but the plan's final task links here.

- [ ] **Step 1: Write the failing tests**

`app/admin/(protected)/content/page.test.tsx`:
```tsx
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/content/schemas/registry", () => ({
  CONTENT_REGISTRY: {
    home: { label: "Home", schema: { type: "group", label: "Home", fields: {} }, defaultValue: {} },
    about: { label: "About", schema: { type: "group", label: "About", fields: {} }, defaultValue: {} },
  },
}));

import ContentListPage from "./page";

test("lists every content area from the registry, linking to its editor", () => {
  render(<ContentListPage />);
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/admin/content/home");
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/admin/content/about");
});
```

Add to `components/admin/AdminNav.test.tsx` (keep existing tests):
```tsx
test("includes a link to the content editor", () => {
  render(<AdminNav />);
  expect(screen.getByRole("link", { name: "Content" })).toHaveAttribute("href", "/admin/content");
});
```

(Check the top of `AdminNav.test.tsx` first for how `usePathname` is mocked — reuse that exact mock setup for the new test rather than introducing a second pattern.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/admin/(protected)/content/page.test.tsx" components/admin/AdminNav.test.tsx`
Expected: FAIL — `./page` doesn't exist yet; the nav test fails because no "Content" link exists.

- [ ] **Step 3: Implement**

`app/admin/(protected)/content/page.tsx`:
```tsx
import Link from "next/link";
import { CONTENT_REGISTRY } from "@/content/schemas/registry";

export default function ContentListPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Content</h1>
      <ul className="flex flex-col gap-3">
        {Object.entries(CONTENT_REGISTRY).map(([key, entry]) => (
          <li key={key} className="border-b border-ink/10 pb-3">
            <Link href={`/admin/content/${key}`} className="font-body text-ink hover:text-brand-green">
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

In `components/admin/AdminNav.tsx`, add a Content entry to `NAV_LINKS` between Gallery and (implicitly) the sign-out button:
```diff
 const NAV_LINKS = [
   { href: "/admin", label: "Dashboard" },
   { href: "/admin/admins", label: "Admins" },
   { href: "/admin/gallery", label: "Gallery" },
+  { href: "/admin/content", label: "Content" },
 ];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/admin/(protected)/content/page.test.tsx" components/admin/AdminNav.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/content" components/admin/AdminNav.tsx components/admin/AdminNav.test.tsx
git commit -m "feat: add the admin content list page and nav link"
```

---

### Task 11: Admin content editor page

**Files:**
- Create: `app/admin/(protected)/content/[key]/page.tsx`
- Create: `components/admin/ContentEditor.tsx`
- Test: `components/admin/ContentEditor.test.tsx`

**Interfaces:**
- Consumes: `SchemaForm` (Tasks 2-5), `useToast` from `components/admin/ToastProvider.tsx`, `CONTENT_REGISTRY` from `content/schemas/registry.ts`.
- Produces: `/admin/content/[key]`, `ContentEditor({ contentKey, schema, label }: { contentKey: string; schema: Field; label: string })`. Leaf of this plan's admin UI.

- [ ] **Step 1: Write the failing test**

`components/admin/ContentEditor.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/admin/ContentEditor.test.tsx`
Expected: FAIL, "Cannot find module './ContentEditor'"

- [ ] **Step 3: Implement**

`components/admin/ContentEditor.tsx`:
```tsx
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
```

`app/admin/(protected)/content/[key]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { CONTENT_REGISTRY } from "@/content/schemas/registry";

export default async function ContentEditorPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const entry = CONTENT_REGISTRY[key];
  if (!entry) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">{entry.label}</h1>
      <ContentEditor contentKey={key} schema={entry.schema} label={entry.label} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/admin/ContentEditor.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/admin/ContentEditor.tsx components/admin/ContentEditor.test.tsx "app/admin/(protected)/content/[key]"
git commit -m "feat: add the content editor page"
```

---

### Task 12: Home content — schema, rendering wire-up, seed

**Files:**
- Modify: `content/home.ts`
- Create: `content/schemas/home.ts`
- Modify: `content/schemas/registry.ts`
- Modify: `app/(site)/page.tsx`
- Modify: `app/(site)/page.test.tsx`
- Create: `content/home.test.ts`

**Interfaces:**
- Produces: `homeContentDefault` (renamed from `homeContent`), `getHomeContent(): Promise<typeof homeContentDefault>`, `homeSchema`. Consumed by `app/(site)/page.tsx` and the registry.

- [ ] **Step 1: Write the failing test**

`content/home.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getHomeContent, homeContentDefault } from "./home";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the home key and returns the merged result", async () => {
  const merged = { ...homeContentDefault, headline: "Edited headline" };
  getSiteContentMock.mockResolvedValue(merged);
  await expect(getHomeContent()).resolves.toEqual(merged);
  expect(getSiteContentMock).toHaveBeenCalledWith("home", homeContentDefault);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/home.test.ts`
Expected: FAIL — `getHomeContent`/`homeContentDefault` don't exist yet (still the old `homeContent` const).

- [ ] **Step 3: Implement**

`content/home.ts`:
```ts
import { getSiteContent } from "@/lib/content/site-content";

export const homeContentDefault = {
  headline: "Send someone who actually shows up.",
  intro:
    "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong about eight years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
  portrait: {
    src: "/images/oto-native.png",
    alt: "OTO, Oluwasegun Theophilus Oladimeji, in gold agbada and fila",
  },
};

export async function getHomeContent() {
  return getSiteContent("home", homeContentDefault);
}
```

`content/schemas/home.ts`:
```ts
import type { Field } from "@/content/schema-types";

export const homeSchema: Field = {
  type: "group",
  label: "Home",
  fields: {
    headline: { type: "text", label: "Headline" },
    intro: { type: "longtext", label: "Intro" },
    portrait: { type: "image", label: "Portrait" },
  },
};
```

In `content/schemas/registry.ts`, replace the placeholder `home` entry:
```diff
+import { homeSchema } from "./home";
+import { homeContentDefault } from "@/content/home";
+
 export const CONTENT_REGISTRY: Record<string, { label: string; schema: Field; defaultValue: unknown }> = {
   home: {
     label: "Home",
-    schema: { type: "group", label: "Home", fields: { headline: { type: "text", label: "Headline" } } },
-    defaultValue: { headline: "" },
+    schema: homeSchema,
+    defaultValue: homeContentDefault,
   },
 };
```

In `app/(site)/page.tsx`, update the import and call site:
```diff
-import { homeContent } from "@/content/home";
+import { getHomeContent } from "@/content/home";
 ...
-export default function HomePage() {
+export default async function HomePage() {
+  const homeContent = await getHomeContent();
   return (
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/home.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Fix the now-broken home page test**

`app/(site)/page.test.tsx` renders `<HomePage />` directly and is not itself async-aware of a Server Component that now awaits data. Since `HomePage` is now `async`, React Testing Library's `render` needs the resolved element. Update every `render(<HomePage />)` call in `app/(site)/page.test.tsx` to:
```tsx
render(await HomePage());
```
This exact pattern (`render(await Component())` for an async Server Component) is already established in this codebase — see `app/admin/(protected)/page.test.tsx`, which does the same thing against `AdminDashboardPage()`. Follow that file's shape.

Also mock `@/content/home` at the top of `app/(site)/page.test.tsx` so the test doesn't depend on live Supabase / `next/headers`:
```tsx
vi.mock("@/content/home", () => ({
  getHomeContent: async () => ({
    headline: "Send someone who actually shows up.",
    intro:
      "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong about eight years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
    portrait: { src: "/images/oto-native.png", alt: "OTO, Oluwasegun Theophilus Oladimeji, in gold agbada and fila" },
  }),
}));
```
Place this mock before the `import HomePage from "./page"` line. These values are copied verbatim from `homeContentDefault` in `content/home.ts` (Step 3 above) — existing assertions in this test file check for this exact text, so the mock must match it exactly.

- [ ] **Step 6: Run the full test suite to check nothing else broke**

Run: `npx vitest run --root "$(pwd)"`
Expected: all tests pass, including `app/(site)/page.test.tsx`.

- [ ] **Step 7: Seed the home row**

Call `mcp__supabase__execute_sql` with `project_id: "jgemycpdcmoebigmgorq"` and:
```sql
insert into public.oto_site_content (key, content)
values ('home', '{
  "headline": "Send someone who actually shows up.",
  "intro": "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong about eight years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
  "portrait": { "src": "/images/oto-native.png", "alt": "OTO, Oluwasegun Theophilus Oladimeji, in gold agbada and fila" }
}'::jsonb)
on conflict (key) do nothing;
```

- [ ] **Step 8: Verify the seed**

Call `mcp__supabase__execute_sql` with `select key, content from oto_site_content where key = 'home'`.
Expected: one row, `content` matching the JSON above exactly.

- [ ] **Step 9: Commit**

```bash
git add content/home.ts content/home.test.ts content/schemas/home.ts content/schemas/registry.ts "app/(site)/page.tsx" "app/(site)/page.test.tsx"
git commit -m "feat: make Home content editable"
```

---

### Task 13: Site content (identity assets + socials, one row) — schema, rendering wire-up, seed

**Files:**
- Modify: `content/site.ts`
- Create: `content/schemas/site.ts`
- Modify: `content/schemas/registry.ts`
- Create: `content/site.test.ts`
- Modify every call site of `siteContent`/`socials` (grep first — see Step 3)

**Interfaces:**
- Produces: `siteContentDefault` (now `{ logo, partyLogo, socials }` combined into one object), `getSiteContentData(): Promise<typeof siteContentDefault>` (named to avoid colliding with `lib/content/site-content.ts`'s `getSiteContent`), `siteSchema`. One row, matching the spec's "nine rows, one per content file" model exactly — `socials` becomes a sibling field inside the same `site` group rather than a separate row.

- [ ] **Step 1: Write the failing test**

`content/site.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getSiteContentData, siteContentDefault } from "./site";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the site key and returns the merged result", async () => {
  getSiteContentMock.mockResolvedValue(siteContentDefault);
  await expect(getSiteContentData()).resolves.toEqual(siteContentDefault);
  expect(getSiteContentMock).toHaveBeenCalledWith("site", siteContentDefault);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/site.test.ts`
Expected: FAIL — `getSiteContentData`/`siteContentDefault` don't exist yet.

- [ ] **Step 3: Find every current call site**

Run: `grep -rn "from \"@/content/site\"" --include="*.tsx" --include="*.ts" app components content | grep -v test`

Expected output includes every file importing `siteContent` or `socials` — note them, since each needs updating in Step 5.

- [ ] **Step 4: Implement**

`content/site.ts`:
```ts
import { getSiteContent } from "@/lib/content/site-content";

export type SocialPlatform = "facebook" | "twitter" | "instagram" | "youtube";

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  href: string;
};

export const siteContentDefault = {
  logo: {
    src: "/images/oto-logo.png",
    alt: "",
  },
  partyLogo: {
    src: "/images/zlp-logo.png",
    alt: "Zenith Labour Party logo",
  },
  socials: [
    { platform: "facebook", label: "Facebook", href: "https://www.facebook.com/" },
    { platform: "twitter", label: "Twitter", href: "https://x.com/" },
    { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
    { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/" },
  ] as SocialLink[],
};

export async function getSiteContentData() {
  return getSiteContent("site", siteContentDefault);
}
```

`content/schemas/site.ts`:
```ts
import type { Field } from "@/content/schema-types";

export const siteSchema: Field = {
  type: "group",
  label: "Site",
  fields: {
    logo: { type: "image", label: "Logo" },
    partyLogo: { type: "image", label: "Party logo" },
    socials: {
      type: "list",
      label: "Social links",
      item: {
        type: "group",
        label: "Link",
        fields: { label: { type: "text", label: "Label" }, href: { type: "text", label: "URL" } },
      },
    },
  },
};
```

`socialsSchema`'s item group deliberately omits `platform` — per Task 2's "`SchemaForm` only touches declared keys" design, each social link's `platform` key passes through unedited on save, while `label`/`href` remain editable.

In `content/schemas/registry.ts`, add the entry:
```diff
+import { siteSchema } from "./site";
+import { siteContentDefault } from "@/content/site";
+
 export const CONTENT_REGISTRY: Record<string, { label: string; schema: Field; defaultValue: unknown }> = {
   home: { ... },
+  site: { label: "Site identity", schema: siteSchema, defaultValue: siteContentDefault },
 };
```

- [ ] **Step 5: Update every call site found in Step 3**

For each file importing `siteContent`: change the import to `getSiteContentData`, make the enclosing component `async` if it isn't already, and `await getSiteContentData()` at the top of the function body, assigning the result to a local `siteContent` variable so the rest of the file's usage (`siteContent.logo`, `siteContent.partyLogo`) is unchanged.

For each file importing `socials`: change the import to `getSiteContentData`, same `async`/`await` treatment, destructuring `const { socials } = await getSiteContentData();` so the rest of the file's usage of `socials` is unchanged.

- [ ] **Step 6: Run the full test suite, fixing any test that renders one of the updated components directly**

Run: `npx vitest run --root "$(pwd)"`
For each failure in a component that now calls `getSiteContentData()` internally, mock `@/content/site` in that test file the same way Task 12 Step 5 mocked `@/content/home` — return the exact same default values so existing assertions keep passing.
Expected: all tests pass.

- [ ] **Step 7: Seed the row**

Call `mcp__supabase__execute_sql`:
```sql
insert into public.oto_site_content (key, content) values
  ('site', '{
    "logo": {"src": "/images/oto-logo.png", "alt": ""},
    "partyLogo": {"src": "/images/zlp-logo.png", "alt": "Zenith Labour Party logo"},
    "socials": [
      {"platform": "facebook", "label": "Facebook", "href": "https://www.facebook.com/"},
      {"platform": "twitter", "label": "Twitter", "href": "https://x.com/"},
      {"platform": "instagram", "label": "Instagram", "href": "https://www.instagram.com/"},
      {"platform": "youtube", "label": "YouTube", "href": "https://www.youtube.com/"}
    ]
  }'::jsonb)
on conflict (key) do nothing;
```

- [ ] **Step 8: Verify the seed**

Call `mcp__supabase__execute_sql` with `select key, content from oto_site_content where key = 'site'`.
Expected: one row matching the JSON above.

- [ ] **Step 9: Commit**

```bash
git add content/site.ts content/site.test.ts content/schemas/site.ts content/schemas/registry.ts
git add -u
git commit -m "feat: make site identity assets and social links editable"
```

(`git add -u` picks up every already-tracked call-site file modified in Step 5, wherever `grep` found them.)

---

### Task 14: Senator Job content — schema, rendering wire-up, seed

**Files:**
- Modify: `content/senator-job.ts`
- Create: `content/schemas/senator-job.ts`
- Modify: `content/schemas/registry.ts`
- Create: `content/senator-job.test.ts`
- Modify: `components/sections/SenatorJob.tsx` (and its test, if it renders the component directly)

**Interfaces:**
- Produces: `senatorJobContentDefault`, `getSenatorJobContent()`, `senatorJobSchema`.

- [ ] **Step 1: Write the failing test**

`content/senator-job.test.ts` — same shape as Task 12 Step 1, substituting `getSenatorJobContent`/`senatorJobContentDefault` and key `"senator-job"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/senator-job.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`content/senator-job.ts`:
```ts
import { getSiteContent } from "@/lib/content/site-content";

export type JobSegment = {
  number: string;
  title: string;
  detail: string;
};

export const senatorJobContentDefault = {
  intro:
    "People look at the Senate and say the job should be part-time. That is a job-description problem, not a workload problem. The work divides into four measurable segments.",
  segments: [
    { number: "1", title: "Make the laws", detail: "Amendment of existing laws, repeal of the ones that have failed, enactment of new ones, and deliberation on the vital issues of national importance." },
    { number: "2", title: "Watch the budget", detail: "Scrutiny of the national budget, passage after amendments are proposed, then monitoring of its implementation, including approval of the instruments that make it work, like external and internal borrowing." },
    { number: "3", title: "Fight for the district's share", detail: "Constant correspondence and travel: writing state governments, ministries, departments and agencies, asking questions, demanding meetings. If 20,000 tractors are provided in the budget, someone must fight through for the 183 due to Oyo South. Even when allocations are not fully released, the one who fights gets some." },
    { number: "4", title: "Bring the investors", detail: "Direct financing of projects with commercial value: the mountain ranges from Idere to Aiyete and Tapa in Ibarapa could open Oyo South to the tourism industry. Every holiday directory lists The Gambia. We have as much here to turn into money." },
  ] as JobSegment[],
  challenge:
    "Now ask: which of these has the current crop done satisfactorily? And if those who did nothing in the House of Representatives are attempting the Senate, ask exactly what they will do differently.",
};

export async function getSenatorJobContent() {
  return getSiteContent("senator-job", senatorJobContentDefault);
}
```

`content/schemas/senator-job.ts`:
```ts
import type { Field } from "@/content/schema-types";

export const senatorJobSchema: Field = {
  type: "group",
  label: "Senator Job",
  fields: {
    intro: { type: "longtext", label: "Intro" },
    segments: {
      type: "list",
      label: "Segments",
      item: {
        type: "group",
        label: "Segment",
        fields: {
          number: { type: "text", label: "Number" },
          title: { type: "text", label: "Title" },
          detail: { type: "longtext", label: "Detail" },
        },
      },
    },
    challenge: { type: "longtext", label: "Challenge" },
  },
};
```

Add to `content/schemas/registry.ts` following the exact pattern from Task 12 Step 3 (import, add entry keyed `"senator-job"`, label `"Senator Job"`).

Update `components/sections/SenatorJob.tsx`: change its import to `getSenatorJobContent`, make it `async`, `await` the call, assign to a local `senatorJobContent` variable (or whatever name it currently destructures from).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/senator-job.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite, fixing SenatorJob's own test with the same mock pattern as Task 12 Step 5**

Run: `npx vitest run --root "$(pwd)"`
Expected: all pass.

- [ ] **Step 6: Seed the row**

Call `mcp__supabase__execute_sql` with an `insert ... on conflict (key) do nothing` using the exact `senatorJobContentDefault` object as the JSONB `content`, key `'senator-job'` — same pattern as Task 12 Step 7, values copied verbatim from Step 3 above.

- [ ] **Step 7: Verify the seed**

`select key, content from oto_site_content where key = 'senator-job'` — one row, matching.

- [ ] **Step 8: Commit**

```bash
git add content/senator-job.ts content/senator-job.test.ts content/schemas/senator-job.ts content/schemas/registry.ts components/sections/SenatorJob.tsx
git add -u
git commit -m "feat: make Senator Job content editable"
```

---

### Task 15: Watch content (excluding the video field) — schema, rendering wire-up, seed

**Files:**
- Modify: `content/watch.ts`
- Create: `content/schemas/watch.ts`
- Modify: `content/schemas/registry.ts`
- Create: `content/watch.test.ts`
- Modify: `components/sections/WatchBlock.tsx`

**Interfaces:**
- Produces: `watchContentDefault`, `getWatchContent()`, `watchSchema`. The `video` field stays a plain hardcoded value on `watchContentDefault`, untouched by the CMS (per the Global Constraints).

- [ ] **Step 1: Write the failing test**

`content/watch.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const getSiteContentMock = vi.fn();
vi.mock("@/lib/content/site-content", () => ({
  getSiteContent: (key: string, fallback: unknown) => getSiteContentMock(key, fallback),
}));

import { getWatchContent, watchContentDefault } from "./watch";

beforeEach(() => {
  getSiteContentMock.mockReset();
});

test("fetches the watch key and returns the merged result", async () => {
  getSiteContentMock.mockResolvedValue(watchContentDefault);
  await expect(getWatchContent()).resolves.toEqual(watchContentDefault);
  expect(getSiteContentMock).toHaveBeenCalledWith("watch", watchContentDefault);
});

test("the video field is never sent through the CMS merge, only editorial text is", async () => {
  getSiteContentMock.mockResolvedValue(watchContentDefault);
  await getWatchContent();
  const [, fallbackArg] = getSiteContentMock.mock.calls[0];
  expect(fallbackArg.video).toEqual(watchContentDefault.video);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/watch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`content/watch.ts` — rename the existing `watchContent` const to `watchContentDefault` (keep its exact current value and every existing comment about the `video` field swap-in, unchanged), then add:
```ts
import { getSiteContent } from "@/lib/content/site-content";

// ... existing VideoSource type and watchContentDefault (renamed from watchContent) unchanged ...

export async function getWatchContent() {
  return getSiteContent("watch", watchContentDefault);
}
```

`content/schemas/watch.ts`:
```ts
import type { Field } from "@/content/schema-types";

export const watchSchema: Field = {
  type: "group",
  label: "Watch",
  fields: {
    title: { type: "text", label: "Title" },
    answer: { type: "text", label: "Answer" },
    body: { type: "longtext", label: "Body" },
    coming: {
      type: "group",
      label: "Held plane copy",
      fields: {
        line: { type: "text", label: "Line" },
        detail: { type: "longtext", label: "Detail" },
      },
    },
  },
};
```

Note `video` is deliberately absent from `watchSchema` — matching the "`SchemaForm` only touches declared keys" behavior from Task 2's design, this means `video` passes through untouched on every save, exactly like the spec requires.

Add to `content/schemas/registry.ts` following the established pattern (key `"watch"`, label `"Watch"`).

Update `components/sections/WatchBlock.tsx`: change its import to `getWatchContent`, make it `async`, `await` the call, keep the rest of the component (including its `video`-based branching logic from the earlier featured-video work) unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/watch.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite, fixing WatchBlock's own test with the mock pattern from Task 12 Step 5**

Run: `npx vitest run --root "$(pwd)"`
The existing `WatchBlock.test.tsx` already mocks `@/content/watch` (from the earlier featured-video work) — update that mock's shape to match the new `getWatchContent` export name instead of a plain `watchContent` object export, keeping every existing test case's assertions intact.
Expected: all pass.

- [ ] **Step 6: Seed the row**

`insert into oto_site_content (key, content) values ('watch', '...')` with the JSONB matching `watchContentDefault`'s `title`, `answer`, `body`, `coming` fields only (omit `video` — the seed only needs to cover schema-declared fields since `video` is never read from the DB row anyway, per Step 3's `SchemaForm` behavior. Including it in the seed JSON is harmless but unnecessary; omit it for clarity that it's not CMS-managed).

- [ ] **Step 7: Verify the seed**

`select key, content from oto_site_content where key = 'watch'` — one row.

- [ ] **Step 8: Commit**

```bash
git add content/watch.ts content/watch.test.ts content/schemas/watch.ts content/schemas/registry.ts components/sections/WatchBlock.tsx components/sections/WatchBlock.test.tsx
git commit -m "feat: make Watch section copy editable, excluding the video field"
```

---

### Task 16: About content — schema, rendering wire-up, seed

**Files:**
- Modify: `content/about.ts`
- Create: `content/schemas/about.ts`
- Modify: `content/schemas/registry.ts`
- Create: `content/about.test.ts`
- Modify every call site of `aboutContent` (grep first, same as Task 13 Step 3)

**Interfaces:**
- Produces: `aboutContentDefault`, `getAboutContent()`, `aboutSchema`.

- [ ] **Step 1: Write the failing test**

`content/about.test.ts` — same shape as Task 12 Step 1, substituting `getAboutContent`/`aboutContentDefault`/key `"about"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/about.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`content/about.ts` — rename `aboutContent` to `aboutContentDefault` (unchanged value), add:
```ts
import { getSiteContent } from "@/lib/content/site-content";

export async function getAboutContent() {
  return getSiteContent("about", aboutContentDefault);
}
```

`content/schemas/about.ts`:
```ts
import type { Field } from "@/content/schema-types";

export const aboutSchema: Field = {
  type: "group",
  label: "About",
  fields: {
    nameParts: { type: "list", label: "Name parts", item: { type: "text", label: "Part" } },
    nameNote: { type: "text", label: "Name note" },
    portrait: { type: "image", label: "Portrait" },
    party: { type: "text", label: "Party" },
    district: { type: "text", label: "District" },
    abujaAnswer: { type: "text", label: "Abuja answer" },
    abujaSupport: { type: "longtext", label: "Abuja support" },
    abujaRecord: { type: "list", label: "Abuja record", item: { type: "longtext", label: "Point" } },
    character: { type: "longtext", label: "Character" },
    quote: { type: "longtext", label: "Quote" },
    education: {
      type: "list",
      label: "Education",
      item: {
        type: "group",
        label: "Entry",
        fields: {
          period: { type: "text", label: "Period" },
          school: { type: "text", label: "School" },
          credential: { type: "text", label: "Credential" },
        },
      },
    },
    tieUps: {
      type: "group",
      label: "University tie-ups",
      fields: {
        lead: { type: "text", label: "Lead line" },
        pairs: {
          type: "list",
          label: "Pairs",
          item: {
            type: "group",
            label: "Pair",
            fields: { uk: { type: "text", label: "UK university" }, ng: { type: "text", label: "Nigerian university" } },
          },
        },
      },
    },
  },
};
```

Add to `content/schemas/registry.ts` (key `"about"`, label `"About"`).

Update every `aboutContent` call site found via `grep -rn "from \"@/content/about\"" --include="*.tsx" --include="*.ts" app components content | grep -v test` to `await getAboutContent()`, same treatment as Task 13 Step 5.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/about.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite, fixing each affected component's test with the mock pattern from Task 12 Step 5**

Run: `npx vitest run --root "$(pwd)"`
Expected: all pass.

- [ ] **Step 6: Seed the row**

`insert into oto_site_content (key, content) values ('about', '...')` with the full JSONB matching `aboutContentDefault` verbatim.

- [ ] **Step 7: Verify the seed**

`select key, content from oto_site_content where key = 'about'` — one row.

- [ ] **Step 8: Commit**

```bash
git add content/about.ts content/about.test.ts content/schemas/about.ts content/schemas/registry.ts
git add -u
git commit -m "feat: make About content editable"
```

---

### Task 17: Get Involved content — schema, rendering wire-up, seed

**Files:**
- Modify: `content/get-involved.ts`
- Create: `content/schemas/get-involved.ts`
- Modify: `content/schemas/registry.ts`
- Create: `content/get-involved.test.ts`
- Modify every call site of `getInvolvedContent` (grep first)

**Interfaces:**
- Produces: `getInvolvedContentDefault`, `getGetInvolvedContent()`, `getInvolvedSchema`.

- [ ] **Step 1: Write the failing test**

`content/get-involved.test.ts` — same shape as Task 12 Step 1, substituting `getGetInvolvedContent`/`getInvolvedContentDefault`/key `"get-involved"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/get-involved.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`content/get-involved.ts` — rename `getInvolvedContent` to `getInvolvedContentDefault` (unchanged value), add:
```ts
import { getSiteContent } from "@/lib/content/site-content";

export async function getGetInvolvedContent() {
  return getSiteContent("get-involved", getInvolvedContentDefault);
}
```

`content/schemas/get-involved.ts`:
```ts
import type { Field } from "@/content/schema-types";

const statPair: Field = {
  type: "group",
  label: "Stat",
  fields: { figure: { type: "text", label: "Figure" }, label: { type: "text", label: "Label" } },
};

export const getInvolvedSchema: Field = {
  type: "group",
  label: "Get Involved",
  fields: {
    turnoutStats: { type: "list", label: "Turnout stats", item: statPair },
    turnoutBody: { type: "longtext", label: "Turnout body" },
    image: { type: "image", label: "Image" },
    asks: {
      type: "list",
      label: "Asks",
      item: {
        type: "group",
        label: "Ask",
        fields: {
          number: { type: "text", label: "Number" },
          title: { type: "text", label: "Title" },
          detail: { type: "longtext", label: "Detail" },
        },
      },
    },
    targetsLead: { type: "text", label: "Targets lead" },
    targets: { type: "list", label: "Targets", item: statPair },
    targetsSupport: { type: "longtext", label: "Targets support" },
    epigraph: { type: "longtext", label: "Epigraph" },
  },
};
```

Add to `content/schemas/registry.ts` (key `"get-involved"`, label `"Get Involved"`).

Update every call site found via `grep -rn "from \"@/content/get-involved\"" --include="*.tsx" --include="*.ts" app components content | grep -v test` to `await getGetInvolvedContent()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/get-involved.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite, fixing each affected component's test with the mock pattern from Task 12 Step 5**

Run: `npx vitest run --root "$(pwd)"`
Expected: all pass.

- [ ] **Step 6: Seed the row**

`insert into oto_site_content (key, content) values ('get-involved', '...')` with the full JSONB matching `getInvolvedContentDefault` verbatim.

- [ ] **Step 7: Verify the seed**

`select key, content from oto_site_content where key = 'get-involved'` — one row.

- [ ] **Step 8: Commit**

```bash
git add content/get-involved.ts content/get-involved.test.ts content/schemas/get-involved.ts content/schemas/registry.ts
git add -u
git commit -m "feat: make Get Involved content editable"
```

---

### Task 18: Atunluto content — schema, rendering wire-up, seed

**Files:**
- Modify: `content/atunluto.ts`
- Create: `content/schemas/atunluto.ts`
- Modify: `content/schemas/registry.ts`
- Create: `content/atunluto.test.ts`
- Modify every call site of `atunlutoContent` (grep first)

**Interfaces:**
- Produces: `atunlutoContentDefault`, `getAtunlutoContent()`, `atunlutoSchema`.

- [ ] **Step 1: Write the failing test**

`content/atunluto.test.ts` — same shape as Task 12 Step 1, substituting `getAtunlutoContent`/`atunlutoContentDefault`/key `"atunluto"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/atunluto.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`content/atunluto.ts` — rename `atunlutoContent` to `atunlutoContentDefault` (unchanged value), add:
```ts
import { getSiteContent } from "@/lib/content/site-content";

export async function getAtunlutoContent() {
  return getSiteContent("atunluto", atunlutoContentDefault);
}
```

`content/schemas/atunluto.ts`:
```ts
import type { Field } from "@/content/schema-types";

const programmeGroup: Field = {
  type: "group",
  label: "Programme group",
  fields: {
    title: { type: "text", label: "Title" },
    entries: { type: "list", label: "Entries", item: { type: "text", label: "Entry" } },
  },
};

export const atunlutoSchema: Field = {
  type: "group",
  label: "Atunluto",
  fields: {
    answer: { type: "text", label: "Answer" },
    caucusLine: { type: "longtext", label: "Caucus line" },
    model: { type: "longtext", label: "Model" },
    stats: {
      type: "list",
      label: "Stats",
      item: {
        type: "group",
        label: "Stat",
        fields: { figure: { type: "text", label: "Figure" }, label: { type: "text", label: "Label" } },
      },
    },
    running: programmeGroup,
    pillars: programmeGroup,
    link: {
      type: "group",
      label: "Link",
      fields: { href: { type: "text", label: "URL" }, label: { type: "text", label: "Label" } },
    },
  },
};
```

Add to `content/schemas/registry.ts` (key `"atunluto"`, label `"Atunluto"`).

Update every call site found via `grep -rn "from \"@/content/atunluto\"" --include="*.tsx" --include="*.ts" app components content | grep -v test` to `await getAtunlutoContent()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/atunluto.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite, fixing each affected component's test with the mock pattern from Task 12 Step 5**

Run: `npx vitest run --root "$(pwd)"`
Expected: all pass.

- [ ] **Step 6: Seed the row**

`insert into oto_site_content (key, content) values ('atunluto', '...')` with the full JSONB matching `atunlutoContentDefault` verbatim.

- [ ] **Step 7: Verify the seed**

`select key, content from oto_site_content where key = 'atunluto'` — one row.

- [ ] **Step 8: Commit**

```bash
git add content/atunluto.ts content/atunluto.test.ts content/schemas/atunluto.ts content/schemas/registry.ts
git add -u
git commit -m "feat: make Atunluto content editable"
```

---

### Task 19: Story content — schema, rendering wire-up, seed

**Files:**
- Modify: `content/story.ts`
- Create: `content/schemas/story.ts`
- Modify: `content/schemas/registry.ts`
- Create: `content/story.test.ts`
- Modify every call site of `storyContent` (grep first)

**Interfaces:**
- Produces: `storyContentDefault`, `getStoryContent()`, `storySchema`.

- [ ] **Step 1: Write the failing test**

`content/story.test.ts` — same shape as Task 12 Step 1, substituting `getStoryContent`/`storyContentDefault`/key `"story"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/story.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`content/story.ts` — rename `storyContent` to `storyContentDefault` (unchanged value), add:
```ts
import { getSiteContent } from "@/lib/content/site-content";

export async function getStoryContent() {
  return getSiteContent("story", storyContentDefault);
}
```

`content/schemas/story.ts`:
```ts
import type { Field } from "@/content/schema-types";

export const storySchema: Field = {
  type: "group",
  label: "Story",
  fields: {
    teaser: {
      type: "group",
      label: "Teaser",
      fields: {
        paragraphs: { type: "list", label: "Paragraphs", item: { type: "longtext", label: "Paragraph" } },
        cta: { type: "text", label: "CTA label" },
        href: { type: "text", label: "CTA link" },
      },
    },
    page: {
      type: "group",
      label: "Full page",
      fields: {
        title: { type: "text", label: "Title" },
        lead: { type: "longtext", label: "Lead" },
        sections: {
          type: "list",
          label: "Sections",
          item: {
            type: "group",
            label: "Section",
            fields: {
              heading: { type: "text", label: "Heading" },
              body: { type: "list", label: "Body", item: { type: "longtext", label: "Paragraph" } },
            },
          },
        },
        closing: {
          type: "group",
          label: "Closing",
          fields: {
            line: { type: "text", label: "Line" },
            cta: { type: "text", label: "CTA label" },
            href: { type: "text", label: "CTA link" },
          },
        },
      },
    },
  },
};
```

Add to `content/schemas/registry.ts` (key `"story"`, label `"Story"`).

Update every call site found via `grep -rn "from \"@/content/story\"" --include="*.tsx" --include="*.ts" app components content | grep -v test` to `await getStoryContent()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/story.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite, fixing each affected component's test with the mock pattern from Task 12 Step 5**

Run: `npx vitest run --root "$(pwd)"`
Expected: all pass. `app/(site)/story/page.tsx` is the primary consumer — apply the same async-page test adjustment as Task 12 Step 5 if its test renders the page component directly.

- [ ] **Step 6: Seed the row**

`insert into oto_site_content (key, content) values ('story', '...')` with the full JSONB matching `storyContentDefault` verbatim (this is the largest single seed value in the plan — copy it directly from the current `content/story.ts` source, converting the TS object literal to JSON: quote every key, drop the `as StorySection[]` type assertions, keep every string exactly as written).

- [ ] **Step 7: Verify the seed**

`select key, content from oto_site_content where key = 'story'` — one row; spot-check `content->'page'->'sections'` has 6 entries matching the source.

- [ ] **Step 8: Commit**

```bash
git add content/story.ts content/story.test.ts content/schemas/story.ts content/schemas/registry.ts
git add -u
git commit -m "feat: make Story content editable"
```

---

### Task 20: Agenda content — schema (with optional fields), rendering wire-up, seed

**Files:**
- Modify: `content/agenda.ts`
- Create: `content/schemas/agenda.ts`
- Modify: `content/schemas/registry.ts`
- Create: `content/agenda.test.ts`
- Modify every call site of `agendaContent` (grep first)

**Interfaces:**
- Produces: `agendaContentDefault`, `getAgendaContent()`, `agendaSchema`. The last and deepest content schema in this plan — exercises every `Field` variant built in Tasks 2-5, including `optional`.

- [ ] **Step 1: Write the failing test**

`content/agenda.test.ts` — same shape as Task 12 Step 1, substituting `getAgendaContent`/`agendaContentDefault`/key `"agenda"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/agenda.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`content/agenda.ts` — rename `agendaContent` to `agendaContentDefault` (unchanged value), add:
```ts
import { getSiteContent } from "@/lib/content/site-content";

export async function getAgendaContent() {
  return getSiteContent("agenda", agendaContentDefault);
}
```

`content/schemas/agenda.ts`:
```ts
import type { Field } from "@/content/schema-types";

const routeSchema: Field = {
  type: "group",
  label: "Route",
  fields: {
    title: { type: "text", label: "Title" },
    points: { type: "list", label: "Points", item: { type: "longtext", label: "Point" } },
  },
};

const itemSchema: Field = {
  type: "group",
  label: "Item",
  fields: {
    number: { type: "text", label: "Number" },
    title: { type: "text", label: "Title" },
    thesis: { type: "longtext", label: "Thesis" },
    points: { type: "optional", field: { type: "list", label: "Points", item: { type: "longtext", label: "Point" } } },
    routes: { type: "optional", field: { type: "list", label: "Routes", item: routeSchema } },
    note: { type: "optional", field: { type: "longtext", label: "Note" } },
  },
};

export const agendaSchema: Field = {
  type: "group",
  label: "Agenda",
  fields: {
    intro: { type: "longtext", label: "Intro" },
    items: { type: "list", label: "Items", item: itemSchema },
  },
};
```

Add to `content/schemas/registry.ts` (key `"agenda"`, label `"Agenda"`).

Update every call site found via `grep -rn "from \"@/content/agenda\"" --include="*.tsx" --include="*.ts" app components content | grep -v test` to `await getAgendaContent()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/agenda.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite, fixing each affected component's test with the mock pattern from Task 12 Step 5**

Run: `npx vitest run --root "$(pwd)"`
Expected: all pass.

- [ ] **Step 6: Seed the row**

`insert into oto_site_content (key, content) values ('agenda', '...')` with the full JSONB matching `agendaContentDefault` verbatim — the largest seed value in the plan (153 lines of source). Convert the TS object literal to JSON exactly: quote every key, drop every `as AgendaRoute[]`/`as string[]` assertion, omit `points`/`routes`/`note` keys entirely from any item object that doesn't have them in the source (do not include them as `null` — the optional-field design in Task 4 treats an absent key as "not present", not a null value).

- [ ] **Step 7: Verify the seed**

`select key, content from oto_site_content where key = 'agenda'` — one row; spot-check `jsonb_array_length(content->'items')` matches the source's item count, and that at least one item has a `routes` key while another has a `points` key instead (confirming the optional-field asymmetry seeded correctly).

- [ ] **Step 8: Commit**

```bash
git add content/agenda.ts content/agenda.test.ts content/schemas/agenda.ts content/schemas/registry.ts
git add -u
git commit -m "feat: make Agenda content editable"
```

---

### Task 21: Full verification pass (controller-executed)

**Files:** None (verification task).

**Interfaces:** None.

Like Task 11 of the gallery-cloudinary plan, this is executed directly rather than dispatched to a subagent: it's the final cross-cutting check after nine content files and their call sites have all been touched, and needs a human-visible checkpoint before considering the CMS live.

- [ ] **Step 1: Full test suite**

Run: `npx vitest run --root "$(pwd)"`
Expected: every test passes, including all nine new `content/*.test.ts` files, `SchemaForm.test.tsx` (15 tests), `ContentEditor.test.tsx`, the content API route test, and every previously-existing test whose component now awaits a `getXContent()` call.

- [ ] **Step 2: Type check and lint**

Run: `npx tsc --noEmit` and `npm run lint`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds; route listing includes `/admin/content` and `/admin/content/[key]` alongside every existing route.

- [ ] **Step 4: Verify every seed row against the registry**

Call `mcp__supabase__execute_sql`:
```sql
select key, jsonb_typeof(content) from oto_site_content order by key;
```
Expected: 9 rows (`home`, `site`, `senator-job`, `watch`, `about`, `get-involved`, `atunluto`, `story`, `agenda`); if the count doesn't match, find and seed whichever key from `content/schemas/registry.ts` is missing before proceeding.

- [ ] **Step 5: Check security advisors**

Call `mcp__supabase__get_advisors` with `project_id: "jgemycpdcmoebigmgorq"`, `type: "security"`.
Expected: no new advisory referencing `oto_site_content`.

- [ ] **Step 6: Visual verification — public site unchanged**

Start the dev server, request `/`, `/story`, and `/gallery`. Confirm every page renders identically to before this plan (same headline, same story text, same agenda items) — the seed rows exactly mirror the hardcoded defaults, so nothing should visibly change yet.

- [ ] **Step 7: Visual verification — admin editor round-trip**

Log into `/admin`, visit `/admin/content`, open Home, change the headline, save, confirm the toast fires and the change persists on reload. Then visit the public `/` and confirm the new headline is live. Revert it back to the original value afterward so the seed and live site stay in sync for the next check.

- [ ] **Step 8: Visual verification — Agenda's optional fields and nested repeating groups**

Open `/admin/content/agenda`, confirm an item that has `routes` renders its nested route groups (each with their own points list), an item that has `points` instead renders a flat points list, and an item without a `note` shows an "Add Note" control rather than an empty field. Add and remove a note on one item to confirm the optional-field round-trip works end to end.

- [ ] **Step 9: Screenshot for UI sign-off**

Per project convention (`feedback_ui_signoff` memory), capture screenshots of `/admin/content` (the list), `/admin/content/home` (a simple editor), and `/admin/content/agenda` (the deepest nested editor) and share with the client before considering this plan's UI complete.
