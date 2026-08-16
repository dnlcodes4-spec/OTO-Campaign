import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { WatchBlock } from "./WatchBlock";

const baseProps = {
  video: null,
  title: "OTO for Senate: the campaign film",
  answer: "Watch him say it himself.",
  body: "Every answer on this page is a commitment the candidate makes in his own voice.",
  coming: { line: "The film is coming.", detail: "" },
};

describe("WatchBlock", () => {
  test("asks the film question and answers it in the campaign's voice", () => {
    render(<WatchBlock {...baseProps} />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Why should you believe a word of this?",
      })
    ).toBeInTheDocument();
    expect(screen.getByText(baseProps.answer)).toBeInTheDocument();
  });

  test("ships the held plane while video is null: no embed, no thumbnail, no fake control", () => {
    const { container } = render(<WatchBlock {...baseProps} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(baseProps.coming.line)).toBeInTheDocument();
  });

  test("renders the YouTube facade when video.type is youtube", () => {
    const props = {
      ...baseProps,
      video: { type: "youtube" as const, videoId: "dQw4w9WgXcQ" },
    };
    const { container } = render(<WatchBlock {...props} />);
    expect(screen.getByAltText(props.title)).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    );
    expect(container.querySelector("video")).toBeNull();
  });

  test("renders the direct facade when video.type is direct", () => {
    const props = {
      ...baseProps,
      video: {
        type: "direct" as const,
        src: "https://res.cloudinary.com/dgols34tu/video/upload/v1/oto-gallery/clip.mp4",
        poster: "https://res.cloudinary.com/dgols34tu/video/upload/so_3/oto-gallery/clip.jpg",
      },
    };
    const { container } = render(<WatchBlock {...props} />);
    expect(screen.getByAltText(props.title)).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/dgols34tu/video/upload/so_3/oto-gallery/clip.jpg"
    );
    expect(container.querySelector("iframe")).toBeNull();
  });
});
