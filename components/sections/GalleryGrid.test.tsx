import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { GalleryGrid } from "./GalleryGrid";
import type { GalleryItem } from "@/content/gallery";

describe("GalleryGrid", () => {
  test("shows the empty state when there are no items", () => {
    render(<GalleryGrid items={[]} />);
    expect(screen.getByText("No photos yet. Check back soon.")).toBeInTheDocument();
  });

  test("renders a card for each item", () => {
    const items: GalleryItem[] = [
      { id: "1", type: "image", url: "/a.jpg", caption: "A", createdAt: "2026-01-01" },
      { id: "2", type: "image", url: "/b.jpg", caption: "B", createdAt: "2026-01-02" },
    ];
    render(<GalleryGrid items={items} />);
    expect(screen.getByAltText("A")).toBeInTheDocument();
    expect(screen.getByAltText("B")).toBeInTheDocument();
  });
});
