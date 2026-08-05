import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  test("renders an internal link", () => {
    render(<Button href="/agenda">Read the agenda</Button>);
    const link = screen.getByRole("link", { name: /read the agenda/i });
    expect(link).toHaveAttribute("href", "/agenda");
  });

  test("renders an external link with target blank and safe rel", () => {
    render(<Button href="https://otoforsenate.ng/">Visit site</Button>);
    const link = screen.getByRole("link", { name: /visit site/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("renders an action button and calls onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Try again</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("appends an arrow for the text variant", () => {
    render(
      <Button href="/agenda" variant="text">
        Read the agenda
      </Button>
    );
    expect(screen.getByRole("link").textContent).toContain("→");
  });

  test("solid variant does not append an arrow", () => {
    render(<Button href="/agenda">Read the agenda</Button>);
    expect(screen.getByRole("link").textContent).not.toContain("→");
  });

  test("defaults to a dark, high-contrast focus-visible outline for the light plane", () => {
    // Button's only current call site (app/gallery/error.tsx) sits on the
    // light bg-surface plane, where brand-gold reaches only 1.69:1 (fails
    // WCAG 1.4.11's 3:1 floor). brand-green reaches 7.05:1 there, so it is
    // the default ring on every render path.
    const { rerender } = render(<Button href="/agenda">Read the agenda</Button>);
    expect(screen.getByRole("link").className).toContain("focus-visible:outline-brand-green");
    expect(screen.getByRole("link").className).not.toContain("focus-visible:outline-brand-gold");

    rerender(<Button onClick={() => {}}>Try again</Button>);
    expect(screen.getByRole("button").className).toContain("focus-visible:outline-brand-green");
  });

  test("plane=\"dark\" switches to the gold outline for green and deep-green planes", () => {
    // Gold reaches 4.16:1 on bg-brand-green and 8.19:1 on bg-brand-green-deep,
    // both clearing the 3:1 floor; brand-green would not (1.91:1 / 1.03:1).
    const { rerender } = render(
      <Button href="/agenda" plane="dark">
        Read the agenda
      </Button>
    );
    expect(screen.getByRole("link").className).toContain("focus-visible:outline-brand-gold");
    expect(screen.getByRole("link").className).not.toContain("focus-visible:outline-brand-green");

    rerender(
      <Button onClick={() => {}} plane="dark">
        Try again
      </Button>
    );
    expect(screen.getByRole("button").className).toContain("focus-visible:outline-brand-gold");
  });
});
