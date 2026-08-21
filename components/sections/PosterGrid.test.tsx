import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { PosterGrid } from "./PosterGrid";
import type { Poster } from "@/content/posters";

const posters: Poster[] = [
  { id: "poster-1", src: "/posters/poster-1.jpg", alt: "Poster one", downloadName: "poster-1.jpg" },
  { id: "poster-2", src: "/posters/poster-2.jpg", alt: "Poster two", downloadName: "poster-2.jpg" },
];

describe("PosterGrid", () => {
  test("renders every poster's image", () => {
    render(<PosterGrid posters={posters} />);
    for (const poster of posters) {
      expect(screen.getByAltText(poster.alt)).toBeInTheDocument();
    }
  });

  test("each poster downloads its own file via a same-origin link", () => {
    render(<PosterGrid posters={posters} />);
    const downloadLinks = screen.getAllByRole("link", { name: "Download" });
    expect(downloadLinks).toHaveLength(posters.length);
    downloadLinks.forEach((link, index) => {
      expect(link).toHaveAttribute("href", posters[index].src);
      expect(link).toHaveAttribute("download", posters[index].downloadName);
    });
  });
});
