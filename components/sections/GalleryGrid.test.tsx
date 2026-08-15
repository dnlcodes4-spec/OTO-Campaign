import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GalleryGrid } from "./GalleryGrid";
import type { GalleryItem } from "@/content/gallery";

const items: GalleryItem[] = [
  { id: "1", type: "image", url: "/a.jpg", caption: "A", createdAt: "2026-01-01" },
  { id: "2", type: "image", url: "/b.jpg", caption: "B", createdAt: "2026-01-02" },
  { id: "3", type: "video", url: "/c.mp4", caption: "C", createdAt: "2026-01-03" },
];

describe("GalleryGrid", () => {
  test("shows the empty state when there are no items, with no filter controls", () => {
    render(<GalleryGrid items={[]} />);
    expect(screen.getByText("No photos yet. Check back soon.")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Filter gallery" })).not.toBeInTheDocument();
  });

  test("renders a card for each item under the default All filter", () => {
    render(<GalleryGrid items={items} />);
    expect(screen.getByAltText("A")).toBeInTheDocument();
    expect(screen.getByAltText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Photos filter shows only images", () => {
    render(<GalleryGrid items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Photos" }));

    expect(screen.getByAltText("A")).toBeInTheDocument();
    expect(screen.getByAltText("B")).toBeInTheDocument();
    expect(screen.queryByText("C")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Photos" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
  });

  test("Videos filter shows only videos", () => {
    render(<GalleryGrid items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));

    expect(screen.queryByAltText("A")).not.toBeInTheDocument();
    expect(screen.queryByAltText("B")).not.toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Videos" })).toHaveAttribute("aria-pressed", "true");
  });

  test("shows a filtered empty state when a filter matches nothing", () => {
    render(<GalleryGrid items={[items[0]]} />);
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));
    expect(screen.getByText("No videos yet. Check back soon.")).toBeInTheDocument();
  });
});
