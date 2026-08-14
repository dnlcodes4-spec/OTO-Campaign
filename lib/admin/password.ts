const PASSWORD_LENGTH = 16;
// Excludes visually ambiguous characters (0/O, 1/l/I) so a generated
// password read aloud or retyped by hand is less error-prone.
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

export function generateStrongPassword(): string {
  const values = new Uint32Array(PASSWORD_LENGTH);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join("");
}
