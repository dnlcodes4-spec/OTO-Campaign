import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const upsertMock = vi.fn(() => ({ select: () => ({ single: singleMock }) }));
const singleMock = vi.fn();
const fromMock = vi.fn(() => ({ select: selectMock, upsert: upsertMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import { GET, PATCH } from "./route";
import { homeContentDefault } from "@/content/home";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  upsertMock.mockClear();
  singleMock.mockReset();
  fromMock.mockClear();
});

test("GET rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await GET(new Request("http://localhost/api/admin/content/home"), {
    params: Promise.resolve({ key: "home" }),
  });
  expect(response.status).toBe(401);
});

test("GET rejects a key not in the registry", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await GET(new Request("http://localhost/api/admin/content/not-a-real-key"), {
    params: Promise.resolve({ key: "not-a-real-key" }),
  });
  expect(response.status).toBe(404);
});

test("GET returns the merged content for a known key", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  maybeSingleMock.mockResolvedValue({ data: { content: { headline: "Edited" } }, error: null });
  const response = await GET(new Request("http://localhost/api/admin/content/home"), {
    params: Promise.resolve({ key: "home" }),
  });
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.content).toEqual({ ...homeContentDefault, headline: "Edited" });
});

test("PATCH rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", { method: "PATCH", body: JSON.stringify({ content: {} }) }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(401);
});

test("PATCH rejects a key not in the registry", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/not-a-real-key", {
      method: "PATCH",
      body: JSON.stringify({ content: {} }),
    }),
    { params: Promise.resolve({ key: "not-a-real-key" }) }
  );
  expect(response.status).toBe(404);
});

test("PATCH upserts the row and returns the saved content", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  singleMock.mockResolvedValue({ data: { content: { headline: "Saved headline" } }, error: null });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", {
      method: "PATCH",
      body: JSON.stringify({ content: { headline: "Saved headline" } }),
    }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(200);
  expect(upsertMock).toHaveBeenCalledWith({
    key: "home",
    content: { headline: "Saved headline" },
    updated_by: "user-1",
    updated_at: expect.any(String),
  });
  const body = await response.json();
  expect(body.content).toEqual({ headline: "Saved headline" });
});

test("PATCH rejects an unparseable JSON body", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", {
      method: "PATCH",
      body: "not json",
    }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(400);
});

test("PATCH rejects a content value that is a string", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", {
      method: "PATCH",
      body: JSON.stringify({ content: "a string" }),
    }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(400);
});

test("PATCH rejects a null content value", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", {
      method: "PATCH",
      body: JSON.stringify({ content: null }),
    }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(400);
});

test("PATCH rejects a body with no content key", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", {
      method: "PATCH",
      body: JSON.stringify({}),
    }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(400);
});

test("PATCH returns 500 on a database error", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  singleMock.mockResolvedValue({ data: null, error: new Error("db down") });
  const response = await PATCH(
    new Request("http://localhost/api/admin/content/home", {
      method: "PATCH",
      body: JSON.stringify({ content: { headline: "x" } }),
    }),
    { params: Promise.resolve({ key: "home" }) }
  );
  expect(response.status).toBe(500);
});
