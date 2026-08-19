import { beforeEach, expect, test, vi } from "vitest";

const createClientMock = vi.fn((...args: unknown[]) => {
  void args;
  return { mocked: "client" };
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

/*
 * The URL comes from the shared SUPABASE_URL constant, not a live
 * process.env read (see lib/supabase/admin.ts), so it's mocked here the
 * same way client.test.ts mocks it rather than through process.env. The
 * fallback behavior itself (env var present vs. missing) is already
 * covered once, generically, in env.test.ts.
 */
vi.mock("./env", () => ({
  SUPABASE_URL: "https://example.supabase.co",
}));

import { createAdminClient } from "./admin";

beforeEach(() => {
  createClientMock.mockClear();
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

test("createAdminClient passes the service-role key, not the publishable key", () => {
  createAdminClient();
  expect(createClientMock).toHaveBeenCalledWith(
    "https://example.supabase.co",
    "test-service-role-key",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
});
