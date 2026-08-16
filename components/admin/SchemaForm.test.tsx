import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  test("shows an error and re-enables the control when onImageUpload rejects", async () => {
    const schema: Field = {
      type: "group",
      label: "Home",
      fields: { portrait: { type: "image", label: "Portrait" } },
    };
    const onChange = vi.fn();
    const onImageUpload = vi.fn().mockRejectedValue(new Error("Cloudinary upload failed"));
    render(
      <SchemaForm
        schema={schema}
        value={{ portrait: { src: "/images/oto-native.png", alt: "OTO" } }}
        onChange={onChange}
        onImageUpload={onImageUpload}
      />
    );

    const file = new File(["fake-bytes"], "new-portrait.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText("Replace image") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onImageUpload).toHaveBeenCalledWith(file));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Cloudinary upload failed"));

    expect(onChange).not.toHaveBeenCalled();
    expect(input).not.toBeDisabled();
    expect(input.value).toBe("");
  });
});
