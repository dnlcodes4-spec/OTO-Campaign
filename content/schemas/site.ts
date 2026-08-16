import type { Field } from "@/content/schema-types";

/*
 * The item group deliberately omits `platform`: per SchemaForm's "only
 * touches declared keys" design (see the schema-types plan), each social
 * link's `platform` key passes through unedited on save, while `label`/
 * `href` remain editable.
 */
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
