import { beforeEach, expect, test, vi } from "vitest";

const createBrowserClientMock = vi.fn(() => ({ mocked: "browser-client" }));
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => createBrowserClientMock(...args),
}));

import { createClient } from "./client";

beforeEach(() => {
  createBrowserClientMock.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
});

test("createClient passes the publishable key to createBrowserClient", () => {
  createClient();
  expect(createBrowserClientMock).toHaveBeenCalledWith(
    "https://example.supabase.co",
    "test-publishable-key"
  );
});
