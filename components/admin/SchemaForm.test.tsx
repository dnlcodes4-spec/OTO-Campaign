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
