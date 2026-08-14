import { expect, test } from "vitest";
import { generateStrongPassword } from "./password";

test("generates a 16-character password", () => {
  expect(generateStrongPassword()).toHaveLength(16);
});

test("only uses characters from the allowed set", () => {
  const password = generateStrongPassword();
  expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9!@#$%^&*]+$/);
});

test("generates different passwords across calls", () => {
  const passwords = new Set(Array.from({ length: 20 }, () => generateStrongPassword()));
  expect(passwords.size).toBeGreaterThan(1);
});
