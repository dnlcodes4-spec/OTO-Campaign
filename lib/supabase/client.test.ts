import { beforeEach, expect, test, vi } from "vitest";

const createBrowserClientMock = vi.fn((...args: unknown[]) => {
  void args;
  return { mocked: "browser-client" };
});
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => createBrowserClientMock(...args),
}));

vi.mock("./env", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
}));

import { createClient } from "./client";

beforeEach(() => {
  createBrowserClientMock.mockClear();
});

test("createClient passes the publishable key to createBrowserClient", () => {
  createClient();
  expect(createBrowserClientMock).toHaveBeenCalledWith(
    "https://example.supabase.co",
    "test-publishable-key"
  );
});
