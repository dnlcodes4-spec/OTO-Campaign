import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/admin/GalleryManager", () => ({
  GalleryManager: () => <div data-testid="gallery-manager" />,
}));

import AdminGalleryPage from "./page";

test("renders a heading and the GalleryManager component", () => {
  render(<AdminGalleryPage />);
  expect(screen.getByText("Gallery")).toBeInTheDocument();
  expect(screen.getByTestId("gallery-manager")).toBeInTheDocument();
});
