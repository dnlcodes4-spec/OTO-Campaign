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
