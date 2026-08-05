import { describe, expect, test } from "vitest";
import robots from "./robots";
import { SITE_URL } from "@/lib/site";

describe("robots", () => {
  test("allows every user agent", () => {
    const { rules } = robots();
    expect(rules).toEqual({ userAgent: "*", allow: "/" });
  });

  test("points at the sitemap on the shared site URL", () => {
    const { sitemap } = robots();
    expect(sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
