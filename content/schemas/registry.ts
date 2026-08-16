import type { Field } from "@/content/schema-types";
import { homeSchema } from "./home";
import { homeContentDefault } from "@/content/home";
import { siteSchema } from "./site";
import { siteContentDefault } from "@/content/site";
import { senatorJobSchema } from "./senator-job";
import { senatorJobContentDefault } from "@/content/senator-job";
import { watchSchema } from "./watch";
import { watchContentDefault } from "@/content/watch";
import { aboutSchema } from "./about";
import { aboutContentDefault } from "@/content/about";
import { getInvolvedSchema } from "./get-involved";
import { getInvolvedContentDefault } from "@/content/get-involved";
import { atunlutoSchema } from "./atunluto";
import { atunlutoContentDefault } from "@/content/atunluto";
import { storySchema } from "./story";
import { storyContentDefault } from "@/content/story";

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
  "senator-job": {
    label: "Senator Job",
    schema: senatorJobSchema,
    defaultValue: senatorJobContentDefault,
  },
  watch: {
    label: "Watch",
    schema: watchSchema,
    defaultValue: watchContentDefault,
  },
  about: {
    label: "About",
    schema: aboutSchema,
    defaultValue: aboutContentDefault,
  },
  "get-involved": {
    label: "Get Involved",
    schema: getInvolvedSchema,
    defaultValue: getInvolvedContentDefault,
  },
  atunluto: {
    label: "Atunluto",
    schema: atunlutoSchema,
    defaultValue: atunlutoContentDefault,
  },
  story: {
    label: "Story",
    schema: storySchema,
    defaultValue: storyContentDefault,
  },
};
