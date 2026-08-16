import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { Nav } from "./Nav";
import { siteContentDefault } from "@/content/site";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const { logo, partyLogo, socials } = siteContentDefault;

/*
 * Nav is a "use client" component: it cannot await CMS-backed content
 * itself, so its server ancestor (app/(site)/layout.tsx) fetches the
 * identity assets and passes them down. Every render below hands Nav the
 * same default values that ancestor would resolve in production.
 */
function renderNav(children?: ReactNode) {
  return render(
    <>
      <Nav logo={logo} partyLogo={partyLogo} socials={socials} />
      {children}
    </>
  );
}

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
    renderNav();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/#about");
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("href", "/#agenda");
    expect(screen.getByRole("link", { name: "Get Involved" })).toHaveAttribute(
      "href",
      "/#get-involved"
    );
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "/gallery");
  });

  test("mobile menu opens as its own layer, locks scroll, and closes", () => {
    renderNav();

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
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  test("renders the wordmark linking home", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "OTO" })).toHaveAttribute("href", "/");
  });

  test("pairs the logo mark with the wordmark without renaming the link", () => {
    const { container } = renderNav();
    const mark = container.querySelector('img[src*="oto-logo"]');
    expect(mark).not.toBeNull();
    expect(mark).toHaveAttribute("alt", "");
    expect(screen.getByRole("link", { name: "OTO" })).toHaveAttribute("href", "/");
  });

  test("carries the party badge in both the desktop cluster and the mobile bar", () => {
    const { container } = renderNav();
    const badges = screen.getAllByAltText(partyLogo.alt);
    // One lives in the hidden-until-lg desktop cluster, the other in the
    // lg:hidden mobile bar beside the menu trigger; both stay mounted at
    // once and CSS decides which one is visible at a given breakpoint.
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge).toHaveAttribute("src", expect.stringContaining("zlp-logo.png"));
    }
    expect(container.querySelectorAll('img[src*="zlp-logo"]')).toHaveLength(2);
  });

  test("aria-controls only points at the overlay while it exists", () => {
    renderNav();
    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(openButton).not.toHaveAttribute("aria-controls");

    fireEvent.click(openButton);
    expect(openButton).toHaveAttribute("aria-controls", "mobile-menu");

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(openButton).not.toHaveAttribute("aria-controls");
  });

  test("closes and unlocks scroll when the viewport crosses into desktop", () => {
    const { crossToDesktop } = stubMatchMedia();
    renderNav();

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
    renderNav();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog", { name: "Site menu" });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("inerts the background landmarks while the menu is open and restores them on close", () => {
    renderNav(
      <>
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
    renderNav(<main>Page content</main>);
    const main = screen.getByText("Page content");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(main).toHaveAttribute("inert");

    crossToDesktop();
    expect(main).not.toHaveAttribute("inert");
  });

  test("tab from the last focusable link wraps to the first, shift+tab from the first wraps to the last", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = screen.getByRole("dialog", { name: "Site menu" });
    const homeLink = within(dialog).getByRole("link", { name: "OTO" });
    // The coda's social marks now sit after the destination links, so the
    // overlay's last focusable control is the final social channel.
    const lastSocial = within(dialog).getByRole("link", {
      name: `OTO on ${socials[socials.length - 1].label}`,
    });

    lastSocial.focus();
    fireEvent.keyDown(lastSocial, { key: "Tab" });
    expect(document.activeElement).toBe(homeLink);

    homeLink.focus();
    fireEvent.keyDown(homeLink, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastSocial);
  });

  test("desktop header carries the four social channels after the section links", () => {
    renderNav();
    expect(socials.map((social) => social.label)).toEqual([
      "Facebook",
      "Twitter",
      "Instagram",
      "YouTube",
    ]);
    for (const social of socials) {
      const link = screen.getByRole("link", { name: `OTO on ${social.label}` });
      expect(link).toHaveAttribute("href", social.href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      // Header bar is the light plane, so the ring is green there.
      expect(link.className).toContain("focus-visible:outline-brand-green");
    }
  });

  test("the overlay coda repeats the social channels with the dark-plane gold ring", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog", { name: "Site menu" });
    for (const social of socials) {
      const link = within(dialog).getByRole("link", { name: `OTO on ${social.label}` });
      expect(link).toHaveAttribute("href", social.href);
      expect(link.className).toContain("focus-visible:outline-brand-gold");
    }
  });

  test("a social link in the overlay leaves the menu open for the visitor's return", () => {
    // Deliberate divergence from the destination links: socials open a new
    // tab, so the page underneath never changes and closing the menu would
    // dump the returning visitor somewhere they did not choose to go.
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog", { name: "Site menu" });

    fireEvent.click(within(dialog).getByRole("link", { name: "OTO on Instagram" }));

    expect(screen.getByRole("dialog", { name: "Site menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("light-plane header controls carry a dark, high-contrast focus-visible outline", () => {
    renderNav();
    // Header bar sits on bg-surface (#f7f8f9). brand-gold only reaches 1.69:1
    // there, failing WCAG 1.4.11's 3:1 floor; brand-green reaches 7.05:1.
    expect(screen.getByRole("link", { name: "OTO" }).className).toContain(
      "focus-visible:outline-brand-green"
    );
    expect(screen.getByRole("link", { name: "OTO" }).className).not.toContain(
      "focus-visible:outline-brand-gold"
    );
    expect(screen.getByRole("link", { name: "About" }).className).toContain(
      "focus-visible:outline-brand-green"
    );
    expect(screen.getByRole("button", { name: "Open menu" }).className).toContain(
      "focus-visible:outline-brand-green"
    );
  });

  test("dark-plane overlay controls keep the gold focus-visible outline", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog", { name: "Site menu" });

    // Overlay body sits on bg-brand-green (#0b622f); gold reaches 4.16:1 there,
    // and 8.19:1 against the deep-green coda. Both clear the 3:1 floor.
    expect(within(dialog).getByRole("link", { name: "OTO" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );
    expect(screen.getByRole("button", { name: "Close menu" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );
    expect(within(dialog).getByRole("link", { name: "Gallery" }).className).toContain(
      "focus-visible:outline-brand-gold"
    );
  });
});
