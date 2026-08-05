import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { Nav } from "./Nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

/*
 * jsdom has no matchMedia at all, and Nav now calls it unconditionally to
 * watch for the desktop breakpoint. Every test renders Nav, so every test
 * needs a stub in place; the one test that cares about crossing the
 * breakpoint installs its own controllable version instead.
 */
beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: "(min-width: 1024px)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
});

/*
 * jsdom has no real matchMedia. This stub hands back a MediaQueryList-shaped
 * object whose change listener the test can fire directly to simulate the
 * viewport crossing the desktop breakpoint.
 */
function stubMatchMedia() {
  let listener: ((event: MediaQueryListEvent) => void) | undefined;
  const mql = {
    matches: false,
    media: "(min-width: 1024px)",
    addEventListener: (_event: string, cb: (event: MediaQueryListEvent) => void) => {
      listener = cb;
    },
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql as unknown as MediaQueryList);
  return {
    crossToDesktop: () => {
      mql.matches = true;
      act(() => {
        listener?.({ matches: true } as MediaQueryListEvent);
      });
    },
  };
}

describe("Nav", () => {
  test("links the one-page sections by anchor and the gallery by route", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/#about");
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("href", "/#agenda");
    expect(screen.getByRole("link", { name: "Get Involved" })).toHaveAttribute(
      "href",
      "/#get-involved"
    );
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "/gallery");
  });

  test("mobile menu opens as its own layer, locks scroll, and closes", () => {
    render(<Nav />);

    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(openButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();

    fireEvent.click(openButton);
    expect(openButton).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getAllByRole("link", { name: "About" })).toHaveLength(2);
    expect(screen.getByText(/Oyo South Senatorial District/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(openButton).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();
  });

  test("escape closes the open menu", () => {
    render(<Nav />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  test("renders the wordmark linking home", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "OTO" })).toHaveAttribute("href", "/");
  });

  test("pairs the logo mark with the wordmark without renaming the link", () => {
    const { container } = render(<Nav />);
    const mark = container.querySelector('img[src*="oto-logo"]');
    expect(mark).not.toBeNull();
    expect(mark).toHaveAttribute("alt", "");
    expect(screen.getByRole("link", { name: "OTO" })).toHaveAttribute("href", "/");
  });

  test("aria-controls only points at the overlay while it exists", () => {
    render(<Nav />);
    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(openButton).not.toHaveAttribute("aria-controls");

    fireEvent.click(openButton);
    expect(openButton).toHaveAttribute("aria-controls", "mobile-menu");

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(openButton).not.toHaveAttribute("aria-controls");
  });

  test("closes and unlocks scroll when the viewport crosses into desktop", () => {
    const { crossToDesktop } = stubMatchMedia();
    render(<Nav />);

    const openButton = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(openButton);
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    crossToDesktop();

    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(openButton).toHaveAttribute("aria-expanded", "false");
    expect(openButton).not.toHaveAttribute("aria-controls");
  });

  test("the open overlay carries dialog semantics, absent while closed", () => {
    render(<Nav />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog", { name: "Site menu" });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("inerts the background landmarks while the menu is open and restores them on close", () => {
    render(
      <>
        <Nav />
        <main>Page content</main>
        <footer>Footer content</footer>
      </>
    );
    const main = screen.getByText("Page content");
    const footer = screen.getByText("Footer content");
    expect(main).not.toHaveAttribute("inert");
    expect(footer).not.toHaveAttribute("inert");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(main).toHaveAttribute("inert");
    expect(footer).toHaveAttribute("inert");

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(main).not.toHaveAttribute("inert");
    expect(footer).not.toHaveAttribute("inert");
  });

  test("restores the inerted background when the viewport crosses into desktop", () => {
    const { crossToDesktop } = stubMatchMedia();
    render(
      <>
        <Nav />
        <main>Page content</main>
      </>
    );
    const main = screen.getByText("Page content");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(main).toHaveAttribute("inert");

    crossToDesktop();
    expect(main).not.toHaveAttribute("inert");
  });

  test("tab from the last focusable link wraps to the first, shift+tab from the first wraps to the last", () => {
    render(<Nav />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = screen.getByRole("dialog", { name: "Site menu" });
    const homeLink = within(dialog).getByRole("link", { name: "OTO" });
    const galleryLink = within(dialog).getByRole("link", { name: "Gallery" });

    galleryLink.focus();
    fireEvent.keyDown(galleryLink, { key: "Tab" });
    expect(document.activeElement).toBe(homeLink);

    homeLink.focus();
    fireEvent.keyDown(homeLink, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(galleryLink);
  });

  test("nav links and controls carry the branded focus-visible outline", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "OTO" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );
    expect(screen.getByRole("link", { name: "About" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );
    expect(screen.getByRole("button", { name: "Open menu" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Close menu" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );
  });
});
