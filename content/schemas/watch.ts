import type { Field } from "@/content/schema-types";

/*
 * channelId and filler are deliberately absent from these fields, the same
 * way video used to be excluded: both are code-level config (a YouTube
 * channel id, a fallback clip's URLs), not editable copy, and are read
 * from watchContentDefault directly rather than this schema's merged
 * result (see content/watch.ts and app/(site)/page.tsx).
 */
export const watchSchema: Field = {
  type: "group",
  label: "Watch",
  fields: {
    answer: { type: "text", label: "Answer" },
    body: { type: "longtext", label: "Body" },
  },
};
