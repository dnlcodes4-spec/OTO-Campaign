import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoFacadeDirect } from "./VideoFacadeDirect";

const src = "https://res.cloudinary.com/dgols34tu/video/upload/v1/oto-gallery/clip.mp4";
const poster =
  "https://res.cloudinary.com/dgols34tu/video/upload/so_3,w_1600,c_fill,q_auto,f_jpg/oto-gallery/clip.jpg";
const title = "OTO for Senate: the campaign film";

describe("VideoFacadeDirect", () => {
  test("holds a poster thumbnail and a real play control, no video element yet", () => {
    const { container } = render(<VideoFacadeDirect src={src} poster={poster} title={title} />);
    expect(screen.getByAltText(title)).toHaveAttribute("src", poster);
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("button", { name: `Play the film: ${title}` })).toBeInTheDocument();
  });

  test("the play control's accessible name starts with its visible label", () => {
    // WCAG 2.5.3 Label in Name: a voice-control user saying the visible
    // words "Play the film" must match the control's accessible name.
    render(<VideoFacadeDirect src={src} poster={poster} title={title} />);
    const play = screen.getByRole("button", { name: /Play the film/ });
    expect(play.getAttribute("aria-label")).toMatch(/^Play the film/);
    expect(play.textContent).toContain("Play the film");
  });

  test("play swaps the facade for an inline, autoplaying video element", () => {
    const { container } = render(<VideoFacadeDirect src={src} poster={poster} title={title} />);
    fireEvent.click(screen.getByRole("button", { name: `Play the film: ${title}` }));

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", src);
    expect(video).toHaveAttribute("poster", poster);
    expect(video!.hasAttribute("controls")).toBe(true);
    expect(video!.hasAttribute("autoplay")).toBe(true);
    expect(video).toHaveAttribute("aria-label", title);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("a dead poster falls back to the flat brand plane and stays playable", () => {
    const { container } = render(<VideoFacadeDirect src={src} poster={poster} title={title} />);
    fireEvent.error(screen.getByAltText(title));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const play = screen.getByRole("button", { name: `Play the film: ${title}` });
    fireEvent.click(play);
    expect(container.querySelector("video")).not.toBeNull();
  });
});
