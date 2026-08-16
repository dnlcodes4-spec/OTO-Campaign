import type { Field } from "@/content/schema-types";
import { homeSchema } from "./home";
import { homeContentDefault } from "@/content/home";
import { siteSchema } from "./site";
import { siteContentDefault } from "@/content/site";

/*
 * One entry per editable content file. Each content task (see the CMS
 * implementation plan) adds or replaces its own key here as it ships;
 * this file grows across the whole plan rather than being written once.
 */
export const CONTENT_REGISTRY: Record<string, { label: string; schema: Field; defaultValue: unknown }> = {
  home: {
    label: "Home",
    schema: homeSchema,
    defaultValue: homeContentDefault,
  },
  site: {
    label: "Site identity",
    schema: siteSchema,
    defaultValue: siteContentDefault,
  },
};
