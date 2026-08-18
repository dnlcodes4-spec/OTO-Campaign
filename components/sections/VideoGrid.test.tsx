import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoGrid } from "./VideoGrid";

const videos = [
  { videoId: "aaaaaaaaaaa", title: "Town hall highlights" },
  { videoId: "bbbbbbbbbbb", title: "Roads and bridges Q&A" },
  { videoId: "ccccccccccc", title: "Rally in Ibadan" },
];

const filler = {
  src: "https://res.cloudinary.com/dgols34tu/video/upload/v1/oto-gallery/clip.mp4",
  poster: "https://res.cloudinary.com/dgols34tu/video/upload/so_3/oto-gallery/clip.jpg",
  title: "OTO for Senate: the campaign film",
};

function sixVideos() {
  return Array.from({ length: 6 }, (_, i) => ({ videoId: `video-${i}`, title: `Video ${i}` }));
}

describe("VideoGrid", () => {
  test("renders one facade tile per video, each with its own title", () => {
    render(<VideoGrid videos={videos} />);
    for (const video of videos) {
      expect(screen.getByRole("button", { name: `Watch: ${video.title}` })).toBeInTheDocument();
      expect(screen.getByAltText(video.title)).toHaveAttribute(
        "src",
        `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`
      );
    }
  });

  test("renders exactly as many tiles as videos given, no placeholders", () => {
    render(<VideoGrid videos={videos.slice(0, 1)} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  test("shows only the filler when there are no real videos yet", () => {
    render(<VideoGrid videos={[]} filler={filler} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(screen.getByRole("button", { name: `Watch: ${filler.title}` })).toBeInTheDocument();
  });

  test("pads remaining slots with the filler after real videos, real videos first", () => {
    render(<VideoGrid videos={videos} filler={filler} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      `Watch: ${videos[0].title}`,
      `Watch: ${videos[1].title}`,
      `Watch: ${videos[2].title}`,
      `Watch: ${filler.title}`,
    ]);
  });

  test("drops the filler once real videos fill all 6 slots", () => {
    render(<VideoGrid videos={sixVideos()} filler={filler} />);
    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(screen.queryByRole("button", { name: `Watch: ${filler.title}` })).not.toBeInTheDocument();
  });

  test("with no filler given, just renders the real videos", () => {
    render(<VideoGrid videos={videos.slice(0, 1)} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
