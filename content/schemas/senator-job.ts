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
