import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/content/watch", () => ({
  watchContent: {
    video: null,
    title: "OTO for Senate: the campaign film",
    answer: "Watch him say it himself.",
    body: "Every answer on this page is a commitment the candidate makes in his own voice.",
    coming: { line: "The film is coming.", detail: "" },
  },
}));

import { watchContent } from "@/content/watch";
import { WatchBlock } from "./WatchBlock";

beforeEach(() => {
  watchContent.video = null;
});

describe("WatchBlock", () => {
  test("asks the film question and answers it in the campaign's voice", () => {
    render(<WatchBlock />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Why should you believe a word of this?",
      })
    ).toBeInTheDocument();
    expect(screen.getByText(watchContent.answer)).toBeInTheDocument();
  });

  test("ships the held plane while video is null: no embed, no thumbnail, no fake control", () => {
    const { container } = render(<WatchBlock />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(watchContent.coming.line)).toBeInTheDocument();
  });

  test("renders the YouTube facade when video.type is youtube", () => {
    watchContent.video = { type: "youtube", videoId: "dQw4w9WgXcQ" };
    const { container } = render(<WatchBlock />);
    expect(screen.getByAltText(watchContent.title)).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    );
    expect(container.querySelector("video")).toBeNull();
  });

  test("renders the direct facade when video.type is direct", () => {
    watchContent.video = {
      type: "direct",
      src: "https://res.cloudinary.com/dgols34tu/video/upload/v1/oto-gallery/clip.mp4",
      poster: "https://res.cloudinary.com/dgols34tu/video/upload/so_3/oto-gallery/clip.jpg",
    };
    const { container } = render(<WatchBlock />);
    expect(screen.getByAltText(watchContent.title)).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/dgols34tu/video/upload/so_3/oto-gallery/clip.jpg"
    );
    expect(container.querySelector("iframe")).toBeNull();
  });
});
