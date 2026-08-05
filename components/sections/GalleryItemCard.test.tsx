import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GalleryItemCard } from "./GalleryItemCard";
import type { GalleryItem } from "@/content/gallery";

const item: GalleryItem = {
  id: "1",
  type: "image",
  url: "/test-image.jpg",
  caption: "Rally in Ibadan",
  createdAt: "2026-01-01",
};

describe("GalleryItemCard", () => {
  test("renders the image and caption", () => {
    render(<GalleryItemCard item={item} />);
    expect(screen.getByAltText("Rally in Ibadan")).toBeInTheDocument();
    expect(screen.getByText("Rally in Ibadan")).toBeInTheDocument();
  });

  test("shows a fallback message when the media fails to load", () => {
    render(<GalleryItemCard item={item} />);
    fireEvent.error(screen.getByAltText("Rally in Ibadan"));
    expect(screen.getByText("This one did not load")).toBeInTheDocument();
  });
});
