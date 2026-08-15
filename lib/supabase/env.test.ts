import { afterEach, expect, test, vi } from "vitest";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  if (ORIGINAL_KEY === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ORIGINAL_KEY;
  vi.resetModules();
});

test("uses the env vars when they are present", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
  vi.resetModules();
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = await import("./env");
  expect(SUPABASE_URL).toBe("https://example.supabase.co");
  expect(SUPABASE_PUBLISHABLE_KEY).toBe("test-key");
});

test("falls back to the real project's publishable values when the env vars are missing", async () => {
  // Both are, by Supabase's own naming convention, safe to expose in
  // client-side code (that's what "publishable" means) — unlike
  // SUPABASE_SERVICE_ROLE_KEY, which must never get this treatment.
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  vi.resetModules();
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = await import("./env");
  expect(SUPABASE_URL).toBe("https://jgemycpdcmoebigmgorq.supabase.co");
  expect(SUPABASE_PUBLISHABLE_KEY).toBe("sb_publishable_iJpna60G11IvxKb8FV_hAA_zqqHxMQZ");
});
