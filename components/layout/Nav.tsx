"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-ink"
          onClick={() => setOpen(false)}
        >
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
          type="button"
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={`h-0.5 w-6 bg-ink transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-ink transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="fixed inset-x-0 top-[65px] bottom-0 flex flex-col gap-2 bg-surface px-6 py-8 lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`font-display text-3xl font-semibold ${
                isActive(pathname, link.href) ? "text-brand-red" : "text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
