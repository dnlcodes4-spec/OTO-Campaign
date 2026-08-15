import { expect, test } from "vitest";
import { isNextInternalSignal } from "./next-internal-errors";

test("recognizes a dynamic-server-usage signal by its digest", () => {
  const error = Object.assign(new Error("Dynamic server usage"), {
    digest: "DYNAMIC_SERVER_USAGE",
  });
  expect(isNextInternalSignal(error)).toBe(true);
});

test("recognizes a redirect() signal by its digest", () => {
  const error = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/admin/login;307;",
  });
  expect(isNextInternalSignal(error)).toBe(true);
});

test("recognizes a notFound() signal by its digest", () => {
  const error = Object.assign(new Error("NEXT_NOT_FOUND"), {
    digest: "NEXT_NOT_FOUND",
  });
  expect(isNextInternalSignal(error)).toBe(true);
});

test("does not treat a genuine error as a Next.js signal", () => {
  expect(isNextInternalSignal(new Error("supabaseUrl is required."))).toBe(false);
});

test("does not treat an error with an unrelated digest as a Next.js signal", () => {
  const error = Object.assign(new Error("boom"), { digest: "some-other-digest" });
  expect(isNextInternalSignal(error)).toBe(false);
});

test("handles non-Error thrown values without crashing", () => {
  expect(isNextInternalSignal("a string")).toBe(false);
  expect(isNextInternalSignal(null)).toBe(false);
  expect(isNextInternalSignal(undefined)).toBe(false);
});
