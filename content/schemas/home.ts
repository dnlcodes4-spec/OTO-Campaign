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
