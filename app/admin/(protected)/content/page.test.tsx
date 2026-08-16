import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/content/schemas/registry", () => ({
  CONTENT_REGISTRY: {
    home: { label: "Home", schema: { type: "group", label: "Home", fields: {} }, defaultValue: {} },
    about: { label: "About", schema: { type: "group", label: "About", fields: {} }, defaultValue: {} },
  },
}));

import ContentListPage from "./page";

test("lists every content area from the registry, linking to its editor", () => {
  render(<ContentListPage />);
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/admin/content/home");
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/admin/content/about");
});
