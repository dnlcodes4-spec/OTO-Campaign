"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SocialLink } from "@/content/site";
import { SocialLinks } from "./SocialLinks";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/story", label: "Story" },
  { href: "/#agenda", label: "Agenda" },
  { href: "/#get-involved", label: "Get Involved" },
  { href: "/gallery", label: "Gallery" },
  { href: "/work-with-us", label: "Work With Us" },
];

/*
 * Branded focus-visible treatment, split by the plane each control sits on.
 * A single gold ring cannot serve both: brand-gold measures only 1.69:1
 * against the light header bar (bg-surface, #f7f8f9), well under WCAG
 * 1.4.11's 3:1 floor for non-text indicators, while a dark ring measures
 * only 1.91:1 / 1.03:1 against the overlay's green / deep-green planes.
 *
 * Light plane (header bar, bg-surface): brand-green measures 7.05:1, so the
 * header wordmark, desktop nav links, and hamburger button use it.
 *
 * Dark planes (mobile overlay body on bg-brand-green, coda on
 * bg-brand-green-deep): brand-gold measures 4.16:1 and 8.19:1 there, so the
 * overlay wordmark, close control, and overlay nav links keep gold.
 *
 * Both deliberately skip outline-none/outline-hidden: those set Tailwind's
 * shared --tw-outline-style variable to "none" unconditionally, and
 * focus-visible:outline-2 reads that same variable, so the two would cancel
 * out and the ring would never render. outline-style is already "none" at
 * rest (the CSS initial value), so nothing needs suppressing there.
 */
const FOCUS_RING_LIGHT_PLANE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green";
const FOCUS_RING_DARK_PLANE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold";

const FOCUSABLE_SELECTOR = "a[href], button:not([disabled])";

/*
 * The section links are anchors into the one-page home, so pathname equality
 * only means anything for real routes like the gallery. Anchor links never
 * take the active color.
 */
function isActive(pathname: string, href: string) {
  return !href.includes("#") && pathname === href;
}

/*
 * The backdrop blur lives on the inner bar, never on the header itself: a
 * backdrop-filter turns its element into the containing block for fixed
 * descendants, which is exactly what collapsed the old overlay to the bar's
 * height and let the page show through it. With the header filter-free, the
 * menu below positions against the real viewport.
 *
 * The open menu is its own composed plane in the page's language: the OTO
 * wordmark and close control hold the top, the four destinations run as a
 * ledger of poster-scale rows anchored to the bottom, and the plane closes on
 * the shared diagonal cut into a deep green coda carrying the party line.
 * The plane wipes in along that same diagonal, motion-safe only, and body
 * scroll stays locked while it is up.
 *
 * Nav is a client component, so it cannot await CMS-backed content itself;
 * app/(site)/layout.tsx fetches it and passes it down as props.
 */
type NavProps = {
  logo: { src: string; alt: string };
  partyLogo: { src: string; alt: string };
  socials: SocialLink[];
};

export function Nav({ logo, partyLogo, socials }: NavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  /*
   * Nav renders only the header; the landmarks it needs to inert live in
   * app/layout.tsx as siblings it does not own. There is exactly one <main>
   * and one <footer> on every route, so a plain landmark-tag query from this
   * effect is the whole mechanism: no id plumbing or ref drilling across the
   * server/client boundary for a layout that never varies. The attribute
   * (not the React 19 `inert` prop, which Nav has no element to hold) is
   * removed in the same cleanup path that already runs on close, on the
   * breakpoint auto-close, and on unmount, so the page is never left inert.
   *
   * Real inert support (mouse, assistive-tech linearization) is defense in
   * depth here; the keydown trap below is what actually contains keyboard
   * focus, since jsdom does not implement inert's focus-blocking behavior
   * and the trap needs to work under test regardless of browser support.
   */
  useEffect(() => {
    if (!open) return;
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    return () => {
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      openButtonRef.current?.focus();
      wasOpen.current = false;
    }
  }, [open]);

  /*
   * The overlay and the scroll lock are both lg:hidden in spirit, but "open"
   * is plain state that does not know about the viewport. Without this, a
   * tablet rotated from portrait to landscape while the menu is open crosses
   * the lg breakpoint, the overlay and hamburger both disappear under
   * lg:hidden, and the body scroll lock from the effect above is never
   * cleaned up because open never flips back to false.
   */
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  /*
   * Explicit keydown trap rather than relying on inert alone: jsdom does not
   * implement inert's focus-blocking, so this is what the wrap-around tests
   * exercise directly, and it is also what actually keeps Tab/Shift+Tab
   * inside the dialog in real browsers regardless of inert support.
   */
  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const container = menuRef.current;
    if (!container) return;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-ink/10 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
          {/*
           * Type-first identity: the wordmark carries the name, the round
           * mark rides beside it at cap height with an empty alt so the
           * link still reads as plain "OTO".
           */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 font-display text-xl font-semibold text-ink ${FOCUS_RING_LIGHT_PLANE}`}
          >
            <Image src={logo.src} alt={logo.alt} width={26} height={26} />
            OTO
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <nav className="flex items-center gap-8">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-body text-sm font-medium ${FOCUS_RING_LIGHT_PLANE} ${
                    isActive(pathname, link.href)
                      ? "text-brand-red"
                      : "text-ink hover:text-brand-green"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {/*
               * The channel marks close the bar after the destinations,
               * separated by a hairline and sized under the text links:
               * secondary wayfinding, not a fifth destination.
               */}
              <SocialLinks
                plane="light"
                socials={socials}
                markClassName="h-4 w-4"
                className="gap-4 border-l border-ink/15 pl-8"
              />
            </nav>
            {/*
             * The party endorsement mark closes the bar on its own, past
             * the channel marks: the badge is the party's official card
             * and stays a plain image, not a link, matching how it
             * appears everywhere else on the site. The header plane sits
             * at bg-surface, close to the badge's own white card, so a
             * drop-shadow (not a border, which would fight the image's
             * baked-in corner radius) is what keeps it legible instead
             * of washing out.
             */}
            <Image
              src={partyLogo.src}
              alt={partyLogo.alt}
              width={93}
              height={80}
              className="h-8 w-auto shrink-0 border-l border-ink/15 pl-8 drop-shadow-sm"
            />
          </div>

          <div className="flex items-center gap-4 lg:hidden">
            {/*
             * Compact companion to the desktop badge: same endorsement
             * mark, scaled down to sit beside the menu trigger without
             * competing with its tap target, which stays the true corner
             * control.
             */}
            <Image
              src={partyLogo.src}
              alt={partyLogo.alt}
              width={93}
              height={80}
              className="h-7 w-auto shrink-0 drop-shadow-sm"
            />
            <button
              ref={openButtonRef}
              type="button"
              className={`flex flex-col gap-1.5 ${FOCUS_RING_LIGHT_PLANE}`}
              aria-label="Open menu"
              aria-expanded={open}
              {...(open ? { "aria-controls": "mobile-menu" } : {})}
              onClick={() => setOpen(true)}
            >
              <span className="h-0.5 w-6 bg-ink" />
              <span className="h-0.5 w-6 bg-ink" />
              <span className="h-0.5 w-6 bg-ink" />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          onKeyDown={trapFocus}
          className="fixed inset-0 z-50 flex flex-col bg-brand-green motion-safe:animate-menu-plane lg:hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 sm:px-8">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`font-display text-xl font-semibold text-ink-inverse ${FOCUS_RING_DARK_PLANE}`}
            >
              OTO
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className={`relative flex h-6 w-6 items-center justify-center ${FOCUS_RING_DARK_PLANE}`}
            >
              <span className="absolute h-0.5 w-6 rotate-45 bg-ink-inverse" />
              <span className="absolute h-0.5 w-6 -rotate-45 bg-ink-inverse" />
            </button>
          </div>

          <div className="mt-auto flex flex-col motion-safe:animate-menu-links">
            <nav className="px-6 sm:px-8">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block border-t border-ink-inverse/15 py-4 font-display text-4xl font-semibold leading-none tracking-tight transition-colors active:text-brand-gold sm:py-5 sm:text-5xl ${FOCUS_RING_DARK_PLANE} ${
                    isActive(pathname, link.href) ? "text-brand-gold" : "text-ink-inverse"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div aria-hidden="true" className="relative mt-10 h-10 w-full sm:h-12">
              <div className="absolute inset-0 bg-brand-green-deep [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
            </div>
            {/*
             * The coda already carries the campaign's identity line, so the
             * channels live with it: a row of marks over the party line,
             * inside the deep green plane the diagonal cut opens. They keep
             * their own tab-order slot after the destinations, which makes
             * the last of them the overlay's final focusable control.
             *
             * Deliberately no setOpen(false) here, unlike every destination
             * link above: these open the platform in a new tab, the page
             * underneath never navigates, so the menu stays up and the
             * returning visitor lands exactly where they left. Closing it
             * would silently move them somewhere they did not choose to go.
             */}
            <div className="bg-brand-green-deep px-6 pt-1 pb-8 sm:px-8">
              <SocialLinks plane="dark" socials={socials} markClassName="h-6 w-6" className="gap-7 py-2" />
              <p className="mt-4 font-body text-sm text-ink-inverse/70">
                <span className="text-brand-gold">Zenith Labour Party.</span> Oyo South
                Senatorial District.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
