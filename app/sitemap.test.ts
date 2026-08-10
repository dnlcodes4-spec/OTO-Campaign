import { describe, expect, test } from "vitest";
import sitemap from "./sitemap";
import { SITE_URL } from "@/lib/site";

describe("sitemap", () => {
  test("lists the home, gallery and story routes on the shared site URL", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toEqual([SITE_URL, `${SITE_URL}/gallery`, `${SITE_URL}/story`]);
  });

  test("every entry carries a lastModified date", () => {
    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });
});
