export type Field =
  | { type: "text"; label: string }
  | { type: "longtext"; label: string }
  | { type: "image"; label: string }
  | { type: "list"; label: string; item: Field }
  | { type: "group"; label: string; fields: Record<string, Field> }
  | { type: "optional"; field: Field };
