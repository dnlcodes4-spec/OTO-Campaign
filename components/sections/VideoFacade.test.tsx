import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoFacade } from "./VideoFacade";

/*
 * The real content ships videoId null, so the facade is exercised here with
 * a stand-in id: the exact component the section swaps to the day the
 * client's film lands.
 */
const videoId = "dQw4w9WgXcQ";
const title = "OTO for Senate: the campaign film";

describe("VideoFacade", () => {
  test("holds a plain thumbnail and a real play control, no YouTube iframe yet", () => {
    const { container } = render(<VideoFacade videoId={videoId} title={title} />);
    expect(screen.getByAltText(title)).toHaveAttribute(
      "src",
      `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    );
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: `Play ${title}` })).toBeInTheDocument();
  });

  test("play swaps the facade for the privacy-enhanced embed", () => {
    const { container } = render(<VideoFacade videoId={videoId} title={title} />);
    fireEvent.click(screen.getByRole("button", { name: `Play ${title}` }));

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toContain(
      `https://www.youtube-nocookie.com/embed/${videoId}`
    );
    expect(iframe).toHaveAttribute("title", title);
    expect(iframe!.hasAttribute("allowfullscreen")).toBe(true);
    const allow = iframe!.getAttribute("allow") ?? "";
    expect(allow).toContain("autoplay");
    expect(allow).toContain("encrypted-media");
    expect(allow).toContain("picture-in-picture");

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("a dead maxres thumbnail steps down to hqdefault", () => {
    render(<VideoFacade videoId={videoId} title={title} />);
    fireEvent.error(screen.getByAltText(title));
    expect(screen.getByAltText(title)).toHaveAttribute(
      "src",
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    );
  });

  test("a dead hqdefault falls back to the flat brand plane and stays playable", () => {
    const { container } = render(<VideoFacade videoId={videoId} title={title} />);
    fireEvent.error(screen.getByAltText(title));
    fireEvent.error(screen.getByAltText(title));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const play = screen.getByRole("button", { name: `Play ${title}` });
    fireEvent.click(play);
    expect(container.querySelector("iframe")).not.toBeNull();
  });
});
