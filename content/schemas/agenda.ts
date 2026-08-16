import type { Field } from "@/content/schema-types";

const routeSchema: Field = {
  type: "group",
  label: "Route",
  fields: {
    title: { type: "text", label: "Title" },
    points: { type: "list", label: "Points", item: { type: "longtext", label: "Point" } },
  },
};

const itemSchema: Field = {
  type: "group",
  label: "Item",
  fields: {
    number: { type: "text", label: "Number" },
    title: { type: "text", label: "Title" },
    thesis: { type: "longtext", label: "Thesis" },
    points: { type: "optional", field: { type: "list", label: "Points", item: { type: "longtext", label: "Point" } } },
    routes: { type: "optional", field: { type: "list", label: "Routes", item: routeSchema } },
    note: { type: "optional", field: { type: "longtext", label: "Note" } },
  },
};

export const agendaSchema: Field = {
  type: "group",
  label: "Agenda",
  fields: {
    intro: { type: "longtext", label: "Intro" },
    items: { type: "list", label: "Items", item: itemSchema },
    pledgesIntro: { type: "longtext", label: "Pledges intro" },
    pledgesPull: { type: "longtext", label: "Pledges pull-line" },
    pledges: {
      type: "list",
      label: "Pledges",
      item: {
        type: "group",
        label: "Pledge",
        fields: {
          title: { type: "text", label: "Title" },
          detail: { type: "longtext", label: "Detail" },
        },
      },
    },
  },
};
