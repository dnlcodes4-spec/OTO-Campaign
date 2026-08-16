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
