import { beforeEach, expect, test, vi } from "vitest";

const createServerClientMock = vi.fn(() => ({ mocked: "server-client" }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}));

const cookiesMock = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

import { createClient } from "./server";

beforeEach(() => {
  createServerClientMock.mockClear();
  cookiesMock.mockReset().mockResolvedValue({
    getAll: () => [{ name: "sb-token", value: "abc" }],
    set: vi.fn(),
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
});

test("createClient passes the publishable key and wires cookies from next/headers", async () => {
  await createClient();
  expect(createServerClientMock).toHaveBeenCalledWith(
    "https://example.supabase.co",
    "test-publishable-key",
    expect.objectContaining({ cookies: expect.any(Object) })
  );
  const passedCookies = createServerClientMock.mock.calls[0][2].cookies;
  expect(passedCookies.getAll()).toEqual([{ name: "sb-token", value: "abc" }]);
});
