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

  test("sets the poster attribute for a video with a posterUrl", () => {
    const videoItem: GalleryItem = {
      id: "2",
      type: "video",
      url: "/test-video.mp4",
      posterUrl: "/test-poster.jpg",
      caption: "Campaign launch",
      createdAt: "2026-01-01",
    };
    const { container } = render(<GalleryItemCard item={videoItem} />);
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("poster", "/test-poster.jpg");
  });
});
