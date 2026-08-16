import type { Field } from "@/content/schema-types";

const statPair: Field = {
  type: "group",
  label: "Stat",
  fields: { figure: { type: "text", label: "Figure" }, label: { type: "text", label: "Label" } },
};

export const getInvolvedSchema: Field = {
  type: "group",
  label: "Get Involved",
  fields: {
    turnoutStats: { type: "list", label: "Turnout stats", item: statPair },
    turnoutBody: { type: "longtext", label: "Turnout body" },
    image: { type: "image", label: "Image" },
    asks: {
      type: "list",
      label: "Asks",
      item: {
        type: "group",
        label: "Ask",
        fields: {
          number: { type: "text", label: "Number" },
          title: { type: "text", label: "Title" },
          detail: { type: "longtext", label: "Detail" },
        },
      },
    },
    targetsLead: { type: "text", label: "Targets lead" },
    targets: { type: "list", label: "Targets", item: statPair },
    targetsSupport: { type: "longtext", label: "Targets support" },
    epigraph: { type: "longtext", label: "Epigraph" },
  },
};
