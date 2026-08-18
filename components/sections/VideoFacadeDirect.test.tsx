import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoFacadeDirect } from "./VideoFacadeDirect";

const src = "https://res.cloudinary.com/dgols34tu/video/upload/v1/oto-gallery/clip.mp4";
const poster = "https://res.cloudinary.com/dgols34tu/video/upload/so_3/oto-gallery/clip.jpg";
const title = "OTO for Senate: the campaign film";

describe("VideoFacadeDirect", () => {
  test("holds a poster image and a real play control, no video element yet", () => {
    render(<VideoFacadeDirect src={src} poster={poster} title={title} />);
    expect(screen.getByAltText(title)).toHaveAttribute("src", poster);
    expect(screen.queryByRole("button", { name: `Watch: ${title}` })).toBeInTheDocument();
  });

  test("play swaps the facade for an inline, autoplaying video element", () => {
    const { container } = render(<VideoFacadeDirect src={src} poster={poster} title={title} />);
    fireEvent.click(screen.getByRole("button", { name: `Watch: ${title}` }));

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", src);
    expect(video!.hasAttribute("autoplay")).toBe(true);
    expect(video!.hasAttribute("controls")).toBe(true);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("a dead poster falls back to the flat brand plane and stays playable", () => {
    const { container } = render(<VideoFacadeDirect src={src} poster={poster} title={title} />);
    fireEvent.error(screen.getByAltText(title));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `Watch: ${title}` }));
    expect(container.querySelector("video")).not.toBeNull();
  });
});
