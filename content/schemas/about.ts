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
