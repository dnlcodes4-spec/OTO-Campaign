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
