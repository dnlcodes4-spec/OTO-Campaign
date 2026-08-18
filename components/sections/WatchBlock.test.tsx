import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { WatchBlock } from "./WatchBlock";

const filler = {
  src: "https://res.cloudinary.com/dgols34tu/video/upload/v1/oto-gallery/clip.mp4",
  poster: "https://res.cloudinary.com/dgols34tu/video/upload/so_3/oto-gallery/clip.jpg",
  title: "OTO for Senate: the campaign film",
};

const baseProps = {
  videos: [],
  filler,
  answer: "Watch him say it himself.",
  body: "Every answer on this page is a commitment the candidate makes in his own voice.",
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

  test("shows only the filler when the channel has no videos yet", () => {
    render(<WatchBlock {...baseProps} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: `Watch: ${filler.title}` })).toBeInTheDocument();
  });

  test("renders a facade tile per real video, plus the filler padding out the rest", () => {
    const props = {
      ...baseProps,
      videos: [
        { videoId: "dQw4w9WgXcQ", title: "Town hall highlights" },
        { videoId: "abc123XYZ00", title: "Rally in Ibadan" },
      ],
    };
    render(<WatchBlock {...props} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(screen.getByAltText("Town hall highlights")).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    );
    expect(buttons[2]).toHaveAttribute("aria-label", `Watch: ${filler.title}`);
  });

  test("drops the filler once the channel has 6 videos of its own", () => {
    const props = {
      ...baseProps,
      videos: Array.from({ length: 6 }, (_, i) => ({ videoId: `video-${i}`, title: `Video ${i}` })),
    };
    render(<WatchBlock {...props} />);
    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(
      screen.queryByRole("button", { name: `Watch: ${filler.title}` })
    ).not.toBeInTheDocument();
  });
});
