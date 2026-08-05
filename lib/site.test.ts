import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_ENV = process.env.NEXT_PUBLIC_SITE_URL;

async function loadSite() {
  vi.resetModules();
  return import("./site");
}

describe("SITE_URL", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_ENV;
    }
  });

  test("defaults to the production domain with no trailing slash", async () => {
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe("https://otoforsenate.ng");
  });

  test("honors NEXT_PUBLIC_SITE_URL when set", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.example.com/";
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe("https://staging.example.com");
  });
});

describe("site constants", () => {
  test("expose the candidate identity used across metadata and the OG image", async () => {
    const { SITE_NAME, CANDIDATE_NAME, CANDIDATE_RACE, SITE_ROUTES } = await loadSite();
    expect(SITE_NAME).toBe("OTO for Senate");
    expect(CANDIDATE_NAME).toBe("Oluwasegun Theophilus Oladimeji");
    expect(CANDIDATE_RACE).toBe("Zenith Labour Party, Oyo South Senatorial District");
    expect(SITE_ROUTES).toEqual(["/", "/gallery"]);
  });
});
