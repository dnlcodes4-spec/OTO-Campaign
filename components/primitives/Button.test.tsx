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

  test("carries the branded focus-visible outline on every render path", () => {
    const { rerender } = render(<Button href="/agenda">Read the agenda</Button>);
    expect(screen.getByRole("link").className).toContain("focus-visible:outline-brand-gold");

    rerender(<Button onClick={() => {}}>Try again</Button>);
    expect(screen.getByRole("button").className).toContain("focus-visible:outline-brand-gold");
  });
});
