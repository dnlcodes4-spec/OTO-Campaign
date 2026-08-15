import { beforeEach, expect, test, vi } from "vitest";

const createClientMock = vi.fn((...args: unknown[]) => {
  void args;
  return { mocked: "client" };
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

import { createAdminClient } from "./admin";

beforeEach(() => {
  createClientMock.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
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
