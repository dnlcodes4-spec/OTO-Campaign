"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteContent } from "@/content/site";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#agenda", label: "Agenda" },
  { href: "/#get-involved", label: "Get Involved" },
  { href: "/gallery", label: "Gallery" },
];

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
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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
            className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink"
          >
            <Image src={siteContent.logo.src} alt={siteContent.logo.alt} width={26} height={26} />
            OTO
          </Link>

          <nav className="hidden lg:flex lg:items-center lg:gap-8">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-body text-sm font-medium ${
                  isActive(pathname, link.href)
                    ? "text-brand-red"
                    : "text-ink hover:text-brand-green"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            ref={openButtonRef}
            type="button"
            className="flex flex-col gap-1.5 lg:hidden"
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

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 flex flex-col bg-brand-green motion-safe:animate-menu-plane lg:hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 sm:px-8">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="font-display text-xl font-semibold text-ink-inverse"
            >
              OTO
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="relative flex h-6 w-6 items-center justify-center"
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
                  className={`block border-t border-ink-inverse/15 py-4 font-display text-4xl font-semibold leading-none tracking-tight transition-colors active:text-brand-gold sm:py-5 sm:text-5xl ${
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
            <div className="bg-brand-green-deep px-6 pt-1 pb-8 sm:px-8">
              <p className="font-body text-sm text-ink-inverse/70">
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
