import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { WatchBlock } from "./WatchBlock";
import { watchContent } from "@/content/watch";

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

  test("ships the held plane while the film is unreleased: no embed, no thumbnail, no fake control", () => {
    // The content file ships with videoId null until the client uploads the
    // film; the section must read as a composed plane in that state, not a
    // broken or empty embed.
    expect(watchContent.videoId).toBeNull();
    const { container } = render(<WatchBlock />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(watchContent.coming.line)).toBeInTheDocument();
  });
});
