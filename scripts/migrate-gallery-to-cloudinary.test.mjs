import { beforeAll, describe, expect, test } from "vitest";

// The script configures the Cloudinary SDK and constructs a Supabase client
// as a top-level side effect (matching the migration spec verbatim). Neither
// call makes a network request, but `createClient` throws synchronously if
// `supabaseUrl` is falsy, so fake-but-well-formed env vars must be in place
// before the module is imported.
beforeAll(() => {
  process.env.CLOUDINARY_CLOUD_NAME ??= "test-cloud";
  process.env.CLOUDINARY_API_KEY ??= "test-key";
  process.env.CLOUDINARY_API_SECRET ??= "test-secret";
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
});

describe("slugify / isVideo", () => {
  test("slugify lowercases and hyphenates a simple filename", async () => {
    const { slugify } = await import("./migrate-gallery-to-cloudinary.mjs");
    expect(slugify("Rally Day One.jpg")).toBe("rally-day-one");
  });

  test("slugify strips leading and trailing separators", async () => {
    const { slugify } = await import("./migrate-gallery-to-cloudinary.mjs");
    expect(slugify("__Town Hall #3__.png")).toBe("town-hall-3");
  });

  test("slugify collapses runs of non-alphanumeric characters", async () => {
    const { slugify } = await import("./migrate-gallery-to-cloudinary.mjs");
    expect(slugify("IMG_0042 (final).HEIC")).toBe("img-0042-final");
  });

  test("slugify drops the extension, not just dots inside the name", async () => {
    const { slugify } = await import("./migrate-gallery-to-cloudinary.mjs");
    expect(slugify("event.recap.v2.mp4")).toBe("event-recap-v2");
  });

  test("isVideo is true only for .mp4 files, case-insensitively", async () => {
    const { isVideo } = await import("./migrate-gallery-to-cloudinary.mjs");
    expect(isVideo("clip.mp4")).toBe(true);
    expect(isVideo("clip.MP4")).toBe(true);
    expect(isVideo("photo.jpg")).toBe(false);
    expect(isVideo("photo.png")).toBe(false);
    expect(isVideo("no-extension")).toBe(false);
  });
});
