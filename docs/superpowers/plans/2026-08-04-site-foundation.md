# Site Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public OTO for Senate campaign site (Home, About, Agenda, Gallery, Get Involved) on the existing Next.js 16 scaffold, with a token-driven design system, self-hosted brand typography, and the gallery built against a swappable data interface so the follow-up gated-admin project can plug in real uploads without touching this UI.

**Architecture:** Design tokens (colors, fonts) live in `app/globals.css` via Tailwind v4's `@theme`. Primitives (`Container`, `Section`, `Heading`, `Button`) consume only those tokens. Section components (`Hero`, `TeaserCard`, `CTABand`, `PedigreeBlock`, `AgendaItem`, `GalleryGrid`, `GalleryItemCard`) compose primitives. Each route's `page.tsx` composes section components with typed content from `content/*.ts`. The gallery's data comes from a single async function, `getGalleryItems()`, so its implementation can change later without the UI changing.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19.2, TypeScript 5, Tailwind CSS v4, Fontshare (Clash Display, Switzer) self-hosted via `next/font/local`, Vitest + React Testing Library for component tests.

## Global Constraints

These apply to every task below; do not repeat them per task, but do not violate them either.

- No AI-generic styling or iconography anywhere (no sparkle icons, no generic template patterns).
- No em dashes anywhere, in UI copy, comments, or commit messages.
- No eyebrows or small uppercase labels above headings or on components.
- Headings, captions, and copy must read as deliberately written for this campaign, not generic placeholder tone.
- Some components must restructure per breakpoint (mobile under 640px, tablet 640 to 1024px, desktop above 1024px), not just scale fluidly. Tailwind's default `sm:` (640px) and `lg:` (1024px) prefixes are the breakpoint vocabulary used throughout this plan.
- Async UI must have loading, empty, and error states; this only applies to the Gallery route in this plan, since every other page is static content.
- Colors and fonts must always come from the tokens defined in Task 2 and Task 3 (`brand-green`, `brand-green-bright`, `brand-green-deep`, `brand-red`, `brand-red-pressed`, `brand-gold`, `brand-gold-deep`, `surface`, `ink`, `ink-inverse`, `font-display`, `font-body`). Never hardcode a hex value or a font-family string in a component.
- This project's `AGENTS.md` requires reading `node_modules/next/dist/docs/` before writing Next.js-specific code, since this Next.js 16 install has breaking changes from older conventions. The two that matter most for this plan: `error.tsx` receives `{ error, retry }`, not `{ error, reset }`; and `next/font/google` cannot load Fontshare fonts, so Clash Display and Switzer are self-hosted via `next/font/local` instead.
- Vitest does not support testing `async` Server Components (confirmed in `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`). Every task below keeps async data-fetching in `page.tsx` files and passes already-resolved data into synchronous, testable components, specifically so this limitation never blocks a task's tests.
- No placeholder or stock images or video anywhere in this plan. `getGalleryItems()` returns `[]` until the follow-up admin project ships real media.

---

## Task 1: Testing Infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.mts`
- Create: `vitest.setup.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs Vitest once; every later task's `*.test.tsx` files rely on this config and on `@testing-library/jest-dom` matchers being globally available.

- [ ] **Step 1: Install test dependencies**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 3: Create the setup file**

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add test scripts to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify with a throwaway test**

Create a temporary file `vitest.smoke.test.ts`:

```ts
import { expect, test } from "vitest";

test("vitest is wired up", () => {
  expect(1 + 1).toBe(2);
});
```

Run: `npm test`
Expected: 1 test passes.

Delete `vitest.smoke.test.ts` after confirming.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.mts vitest.setup.ts
git commit -m "test: add Vitest and React Testing Library"
```

---

## Task 2: Design Tokens

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind utility classes `bg-brand-green`, `text-brand-green`, `border-brand-green` (and the same for `brand-green-bright`, `brand-green-deep`, `brand-red`, `brand-red-pressed`, `brand-gold`, `brand-gold-deep`, `surface`, `ink`, `ink-inverse`), plus `font-display` and `font-body` utilities once Task 3 defines `--font-clash-display` and `--font-switzer`. Every later task's components use these class names.

- [ ] **Step 1: Replace the boilerplate tokens**

Replace the full contents of `app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  --color-brand-green: #0b622f;
  --color-brand-green-bright: #009846;
  --color-brand-green-deep: #132d1f;
  --color-brand-red: #e31e24;
  --color-brand-red-pressed: #c92223;
  --color-brand-gold: #f5b700;
  --color-brand-gold-deep: #c9a227;
  --color-surface: #f7f8f9;
  --color-ink: #2b2a29;
  --color-ink-inverse: #fefefe;

  --font-display: var(--font-clash-display), sans-serif;
  --font-body: var(--font-switzer), sans-serif;
}

body {
  background-color: var(--color-surface);
  color: var(--color-ink);
}
```

This removes the default Geist font tokens and the `prefers-color-scheme: dark` block from the boilerplate. This site commits to one deliberate brand identity rather than a light/dark toggle; Task 3 introduces the two font variables referenced above.

- [ ] **Step 2: Verify the build still compiles**

Run: `npm run build`
Expected: build fails at this point only if `--font-clash-display` or `--font-switzer` are referenced incorrectly. They are just CSS custom property names here (not yet defined), which is valid CSS and will not fail the build; the build should succeed. If it fails for an unrelated reason (e.g. a missing font file from a previous partial run), investigate before proceeding.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add brand color and font design tokens"
```

---

## Task 3: Self-Hosted Fonts

**Files:**
- Create: `app/fonts/files/ClashDisplay-Medium.woff2`
- Create: `app/fonts/files/ClashDisplay-Semibold.woff2`
- Create: `app/fonts/files/Switzer-Regular.woff2`
- Create: `app/fonts/files/Switzer-Medium.woff2`
- Create: `app/fonts/index.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `clashDisplay` and `switzer` exports from `@/app/fonts`, each a `next/font/local` result with a `.variable` property (`--font-clash-display` and `--font-switzer` respectively). Task 8 (root layout) applies these `.variable` classes to `<html>`.

Clash Display and Switzer are Fontshare fonts, not Google Fonts, so `next/font/google` cannot load them. `next/font/local` self-hosts font files you provide, which is the correct approach here per `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`.

- [ ] **Step 1: Create the fonts directory**

Run: `mkdir -p app/fonts/files`

- [ ] **Step 2: Download the four font files**

These URLs were confirmed stable and content-hashed from Fontshare's CSS API. Run:

```bash
curl -L -o app/fonts/files/ClashDisplay-Medium.woff2 "https://cdn.fontshare.com/wf/2GQIT54GKQY3JRFTSHS4ARTRNRQISSAA/3CIP5EBHRRHE5FVQU3VFROPUERNDSTDF/JTSL5QESUXATU47LCPUNHZQBDDIWDOSW.woff2"
curl -L -o app/fonts/files/ClashDisplay-Semibold.woff2 "https://cdn.fontshare.com/wf/FPDAZ2S6SW4QMSRIIKNNGTPM6VIXYMKO/5HNPQ453FRLIQWV2FNOBUU3FKTDZQVSG/Z3MGHFHX6DCTLQ55LJYRJ5MDCZPMFZU6.woff2"
curl -L -o app/fonts/files/Switzer-Regular.woff2 "https://cdn.fontshare.com/wf/BLNB4FAQFNK56DWWNF7PMGTCOTZHOEII/ST3WKSSDMBK2MIQQO3MAVYWLF4FTOLFV/6IN5WOLRCYP4G4MOCOHOMXNON6Q7MDAR.woff2"
curl -L -o app/fonts/files/Switzer-Medium.woff2 "https://cdn.fontshare.com/wf/OYB4CXKJQXKTNSLJMTDQOIVUL2V5EL7S/WYO2P7DQVV5RNXGMCUO2HL4RJP4VFUAS/6XPIMU23OJVRY676OG5YVJMWEHWICATX.woff2"
```

If any of these URLs return a 404 (Fontshare occasionally rotates hashes), fetch fresh ones with:
```bash
curl -s "https://api.fontshare.com/v2/css?f[]=clash-display@600,500&f[]=switzer@400,500&display=swap" | grep -oE "url\('[^']+\.woff2'\)"
```
and substitute the new URLs, keeping the same four output filenames and weight-to-file mapping.

- [ ] **Step 3: Verify the downloads are valid font files**

Run: `file app/fonts/files/*.woff2`
Expected: all four report `Web Open Font Format (Version 2)`, and none are 0 bytes (`ls -la app/fonts/files`).

- [ ] **Step 4: Wire up next/font/local**

Create `app/fonts/index.ts`:

```ts
import localFont from "next/font/local";

export const clashDisplay = localFont({
  src: [
    { path: "./files/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "./files/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-clash-display",
  display: "swap",
});

export const switzer = localFont({
  src: [
    { path: "./files/Switzer-Regular.woff2", weight: "400", style: "normal" },
    { path: "./files/Switzer-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-switzer",
  display: "swap",
});
```

- [ ] **Step 5: Commit**

```bash
git add app/fonts
git commit -m "feat: self-host Clash Display and Switzer fonts"
```

---

## Task 4: Container and Section Primitives

**Files:**
- Create: `components/primitives/Container.tsx`
- Create: `components/primitives/Container.test.tsx`
- Create: `components/primitives/Section.tsx`
- Create: `components/primitives/Section.test.tsx`

**Interfaces:**
- Consumes: nothing beyond the tokens from Task 2.
- Produces: `Container({ children, className? })` and `Section({ children, className?, tone? })` where `tone` is `"surface" | "green" | "ink"` (default `"surface"`). Every page task below wraps its content in `Section`.

- [ ] **Step 1: Write the failing Container test**

Create `components/primitives/Container.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Container } from "./Container";

describe("Container", () => {
  test("renders its children", () => {
    render(<Container>content</Container>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- Container.test`
Expected: FAIL, `Cannot find module './Container'`.

- [ ] **Step 3: Implement Container**

Create `components/primitives/Container.tsx`:

```tsx
import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm test -- Container.test`
Expected: PASS.

- [ ] **Step 5: Write the failing Section test**

Create `components/primitives/Section.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Section } from "./Section";

describe("Section", () => {
  test("renders its children", () => {
    render(<Section>content</Section>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `npm test -- Section.test`
Expected: FAIL, `Cannot find module './Section'`.

- [ ] **Step 7: Implement Section**

Create `components/primitives/Section.tsx`:

```tsx
import type { ReactNode } from "react";
import { Container } from "./Container";

type SectionTone = "surface" | "green" | "ink";

type SectionProps = {
  children: ReactNode;
  className?: string;
  tone?: SectionTone;
};

const TONE_BG: Record<SectionTone, string> = {
  surface: "bg-surface text-ink",
  green: "bg-brand-green text-ink-inverse",
  ink: "bg-brand-green-deep text-ink-inverse",
};

export function Section({ children, className = "", tone = "surface" }: SectionProps) {
  return (
    <section className={`py-16 sm:py-20 lg:py-28 ${TONE_BG[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
```

- [ ] **Step 8: Run both tests to confirm they pass**

Run: `npm test -- Container.test Section.test`
Expected: 2 tests pass.

- [ ] **Step 9: Commit**

```bash
git add components/primitives/Container.tsx components/primitives/Container.test.tsx components/primitives/Section.tsx components/primitives/Section.test.tsx
git commit -m "feat: add Container and Section primitives"
```

---

## Task 5: Heading and Button Primitives

**Files:**
- Create: `components/primitives/Heading.tsx`
- Create: `components/primitives/Heading.test.tsx`
- Create: `components/primitives/Button.tsx`
- Create: `components/primitives/Button.test.tsx`

**Interfaces:**
- Consumes: tokens from Task 2.
- Produces:
  - `Heading({ level: 1 | 2 | 3 | 4, children, className? })`, rendering `<h1>`-`<h4>` in Clash Display, sized per level with distinct classes per breakpoint (not fluid `clamp()`).
  - `Button(props)`, a discriminated union: `{ href, tone?, variant?, className?, children }` or `{ onClick, tone?, variant?, className?, children }`, where `tone` is `"red" | "gold" | "green"` (default `"red"`) and `variant` is `"solid" | "text"` (default `"solid"`). Internal `href`s render `next/link`; `href`s starting with `http://` or `https://` render a plain `<a target="_blank" rel="noopener noreferrer">`; `onClick` renders a `<button type="button">`. The `"text"` variant appends a `→` arrow after the children. Every section component task below uses `Heading` and `Button`.

- [ ] **Step 1: Write the failing Heading test**

Create `components/primitives/Heading.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Heading } from "./Heading";

describe("Heading", () => {
  test("renders the semantic tag matching its level", () => {
    render(<Heading level={2}>Section title</Heading>);
    expect(screen.getByRole("heading", { level: 2, name: "Section title" })).toBeInTheDocument();
  });

  test("renders level 1 as an h1", () => {
    render(<Heading level={1}>Page title</Heading>);
    expect(screen.getByRole("heading", { level: 1, name: "Page title" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- Heading.test`
Expected: FAIL, `Cannot find module './Heading'`.

- [ ] **Step 3: Implement Heading**

Create `components/primitives/Heading.tsx`:

```tsx
import type { ElementType, ReactNode } from "react";

type HeadingLevel = 1 | 2 | 3 | 4;

type HeadingProps = {
  level: HeadingLevel;
  children: ReactNode;
  className?: string;
};

const LEVEL_TAG: Record<HeadingLevel, ElementType> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

const LEVEL_STYLES: Record<HeadingLevel, string> = {
  1: "text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight",
  2: "text-3xl sm:text-4xl lg:text-5xl leading-[1.02] tracking-tight",
  3: "text-2xl sm:text-3xl leading-tight",
  4: "text-xl sm:text-2xl leading-tight",
};

export function Heading({ level, children, className = "" }: HeadingProps) {
  const Tag = LEVEL_TAG[level];
  return (
    <Tag className={`font-display font-semibold ${LEVEL_STYLES[level]} ${className}`}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm test -- Heading.test`
Expected: 2 tests pass.

- [ ] **Step 5: Write the failing Button tests**

Create `components/primitives/Button.test.tsx`:

```tsx
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
});
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `npm test -- Button.test`
Expected: FAIL, `Cannot find module './Button'`.

- [ ] **Step 7: Implement Button**

Create `components/primitives/Button.tsx`:

```tsx
import type { MouseEventHandler, ReactNode } from "react";
import Link from "next/link";

type ButtonTone = "red" | "gold" | "green";
type ButtonVariant = "solid" | "text";

type BaseProps = {
  children: ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  className?: string;
};

type LinkButtonProps = BaseProps & {
  href: string;
};

type ActionButtonProps = BaseProps & {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

type ButtonProps = LinkButtonProps | ActionButtonProps;

const TONE_SOLID: Record<ButtonTone, string> = {
  red: "bg-brand-red text-ink-inverse hover:bg-brand-red-pressed",
  gold: "bg-brand-gold text-ink hover:bg-brand-gold-deep",
  green: "bg-brand-green text-ink-inverse hover:bg-brand-green-bright",
};

const TONE_TEXT: Record<ButtonTone, string> = {
  red: "text-brand-red border-brand-red",
  gold: "text-brand-gold-deep border-brand-gold-deep",
  green: "text-brand-green border-brand-green",
};

function buttonClasses(tone: ButtonTone, variant: ButtonVariant, className: string) {
  const base = "inline-flex items-center gap-2 font-body font-medium transition-colors";
  if (variant === "solid") {
    return `${base} px-6 py-3 text-sm ${TONE_SOLID[tone]} ${className}`;
  }
  return `${base} border-b-2 pb-0.5 text-base ${TONE_TEXT[tone]} ${className}`;
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function Button(props: ButtonProps) {
  const { children, tone = "red", variant = "solid", className = "" } = props;
  const classes = buttonClasses(tone, variant, className);
  const content =
    variant === "text" ? (
      <>
        {children} <span aria-hidden="true">&rarr;</span>
      </>
    ) : (
      children
    );

  if ("href" in props) {
    if (isExternalHref(props.href)) {
      return (
        <a href={props.href} target="_blank" rel="noopener noreferrer" className={classes}>
          {content}
        </a>
      );
    }
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={classes}>
      {content}
    </button>
  );
}
```

- [ ] **Step 8: Run it to confirm it passes**

Run: `npm test -- Button.test`
Expected: 5 tests pass.

- [ ] **Step 9: Commit**

```bash
git add components/primitives/Heading.tsx components/primitives/Heading.test.tsx components/primitives/Button.tsx components/primitives/Button.test.tsx
git commit -m "feat: add Heading and Button primitives"
```

---

## Task 6: Nav Component

**Files:**
- Create: `components/layout/Nav.tsx`
- Create: `components/layout/Nav.test.tsx`

**Interfaces:**
- Consumes: tokens from Task 2, `next/link`, `usePathname` from `next/navigation`.
- Produces: `Nav()`, a Client Component with no props. Task 8 (root layout) renders it once, above `{children}`.

Per the responsive strategy in the spec, mobile does not get squeezed-down inline links; it gets a full-screen overlay menu triggered by a toggle button.

- [ ] **Step 1: Write the failing test**

Create `components/layout/Nav.test.tsx`:

```tsx
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Nav } from "./Nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Nav", () => {
  test("mobile menu is closed by default and toggles open and closed", () => {
    render(<Nav />);

    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(openButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(openButton);
    const closeButton = screen.getByRole("button", { name: "Close menu" });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(closeButton);
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  });

  test("renders the wordmark linking home", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "OTO" })).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- Nav.test`
Expected: FAIL, `Cannot find module './Nav'`.

- [ ] **Step 3: Implement Nav**

Create `components/layout/Nav.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/agenda", label: "Agenda" },
  { href: "/gallery", label: "Gallery" },
  { href: "/get-involved", label: "Get Involved" },
];

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
                pathname === link.href ? "text-brand-red" : "text-ink hover:text-brand-green"
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
                pathname === link.href ? "text-brand-red" : "text-ink"
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
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm test -- Nav.test`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Nav.tsx components/layout/Nav.test.tsx
git commit -m "feat: add Nav with full-screen mobile menu"
```

---

## Task 7: Footer Component

**Files:**
- Create: `components/layout/Footer.tsx`
- Create: `components/layout/Footer.test.tsx`

**Interfaces:**
- Consumes: tokens from Task 2.
- Produces: `Footer()`, no props. Task 8 (root layout) renders it once, below `{children}`.

- [ ] **Step 1: Write the failing test**

Create `components/layout/Footer.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  test("renders the candidate name and nav links", () => {
    render(<Footer />);
    expect(screen.getByText("OTO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Get Involved" })).toHaveAttribute("href", "/get-involved");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- Footer.test`
Expected: FAIL, `Cannot find module './Footer'`.

- [ ] **Step 3: Implement Footer**

Create `components/layout/Footer.tsx`:

```tsx
import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/agenda", label: "Agenda" },
  { href: "/gallery", label: "Gallery" },
  { href: "/get-involved", label: "Get Involved" },
];

export function Footer() {
  return (
    <footer className="bg-brand-green-deep px-6 py-12 text-ink-inverse sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-2xl font-semibold">OTO</p>
          <p className="mt-2 max-w-sm font-body text-sm text-ink-inverse/80">
            Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.
          </p>
        </div>
        <nav className="flex flex-col gap-2 sm:items-end">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm text-ink-inverse/80 hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm test -- Footer.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Footer.tsx components/layout/Footer.test.tsx
git commit -m "feat: add Footer"
```

---

## Task 8: Root Layout Wiring

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `clashDisplay`, `switzer` from `@/app/fonts` (Task 3); `Nav` from `@/components/layout/Nav` (Task 6); `Footer` from `@/components/layout/Footer` (Task 7).
- Produces: every route now renders inside `<Nav />...children...<Footer />` with both fonts loaded as CSS variables on `<html>`.

- [ ] **Step 1: Replace the root layout**

Replace the full contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { clashDisplay, switzer } from "./fonts";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTO for Senate | Oyo South Senatorial District",
  description:
    "Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${clashDisplay.variable} ${switzer.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-surface font-body text-ink antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Run the dev server and check it boots**

Run: `npm run dev` (in the background), then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: `200`. Stop the dev server afterward.

If the fonts fail to load, double check `app/fonts/files/*.woff2` exist and are non-empty (Task 3, Step 3).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wire fonts, Nav, and Footer into the root layout"
```

---

## Task 9: Gallery Data Interface

**Files:**
- Create: `content/gallery.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type GalleryItem = { id: string; type: "image" | "video"; url: string; caption: string; createdAt: string }` and `getGalleryItems(): Promise<GalleryItem[]>`. Task 10 (GalleryGrid, GalleryItemCard) and Task 11 (gallery route) both depend on this exact shape. The follow-up gated-admin project only ever needs to change this file's internals.

- [ ] **Step 1: Create the interface**

Create `content/gallery.ts`:

```ts
export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string;
  createdAt: string;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  return [];
}
```

No placeholder or stock media ships here. Returning `[]` means the Gallery page's empty state (Task 11) is exercised for real, not just in theory.

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors referencing `content/gallery.ts`.

- [ ] **Step 3: Commit**

```bash
git add content/gallery.ts
git commit -m "feat: add the gallery data interface"
```

---

## Task 10: GalleryItemCard and GalleryGrid

**Files:**
- Create: `components/sections/GalleryItemCard.tsx`
- Create: `components/sections/GalleryItemCard.test.tsx`
- Create: `components/sections/GalleryGrid.tsx`
- Create: `components/sections/GalleryGrid.test.tsx`

**Interfaces:**
- Consumes: `GalleryItem` type from `@/content/gallery` (Task 9).
- Produces: `GalleryItemCard({ item: GalleryItem })` and `GalleryGrid({ items: GalleryItem[] })`, both synchronous Client Components so they stay unit-testable (Vitest cannot test `async` Server Components). Task 11 (gallery route) renders `GalleryGrid` with the resolved items.

Per the responsive strategy, captions are always visible on mobile and tablet, and hover-revealed only at desktop width, since hover does not exist on touch devices.

- [ ] **Step 1: Write the failing GalleryItemCard tests**

Create `components/sections/GalleryItemCard.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GalleryItemCard } from "./GalleryItemCard";
import type { GalleryItem } from "@/content/gallery";

const item: GalleryItem = {
  id: "1",
  type: "image",
  url: "/test-image.jpg",
  caption: "Rally in Ibadan",
  createdAt: "2026-01-01",
};

describe("GalleryItemCard", () => {
  test("renders the image and caption", () => {
    render(<GalleryItemCard item={item} />);
    expect(screen.getByAltText("Rally in Ibadan")).toBeInTheDocument();
    expect(screen.getByText("Rally in Ibadan")).toBeInTheDocument();
  });

  test("shows a fallback message when the media fails to load", () => {
    render(<GalleryItemCard item={item} />);
    fireEvent.error(screen.getByAltText("Rally in Ibadan"));
    expect(screen.getByText("This one did not load")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- GalleryItemCard.test`
Expected: FAIL, `Cannot find module './GalleryItemCard'`.

- [ ] **Step 3: Implement GalleryItemCard**

Create `components/sections/GalleryItemCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { GalleryItem } from "@/content/gallery";

type GalleryItemCardProps = {
  item: GalleryItem;
};

export function GalleryItemCard({ item }: GalleryItemCardProps) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="group relative aspect-[4/5] overflow-hidden bg-brand-green-deep sm:aspect-square">
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
          <p className="font-body text-sm text-ink-inverse/80">This one did not load</p>
        </div>
      ) : item.type === "image" ? (
        <Image
          src={item.url}
          alt={item.caption}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <video
          src={item.url}
          className="h-full w-full object-cover"
          controls
          onError={() => setFailed(true)}
        />
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-2 font-body text-xs text-ink-inverse opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
        {item.caption}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm test -- GalleryItemCard.test`
Expected: 2 tests pass.

- [ ] **Step 5: Write the failing GalleryGrid tests**

Create `components/sections/GalleryGrid.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { GalleryGrid } from "./GalleryGrid";
import type { GalleryItem } from "@/content/gallery";

describe("GalleryGrid", () => {
  test("shows the empty state when there are no items", () => {
    render(<GalleryGrid items={[]} />);
    expect(screen.getByText("No photos yet. Check back soon.")).toBeInTheDocument();
  });

  test("renders a card for each item", () => {
    const items: GalleryItem[] = [
      { id: "1", type: "image", url: "/a.jpg", caption: "A", createdAt: "2026-01-01" },
      { id: "2", type: "image", url: "/b.jpg", caption: "B", createdAt: "2026-01-02" },
    ];
    render(<GalleryGrid items={items} />);
    expect(screen.getByAltText("A")).toBeInTheDocument();
    expect(screen.getByAltText("B")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `npm test -- GalleryGrid.test`
Expected: FAIL, `Cannot find module './GalleryGrid'`.

- [ ] **Step 7: Implement GalleryGrid**

Create `components/sections/GalleryGrid.tsx`:

```tsx
import type { GalleryItem } from "@/content/gallery";
import { GalleryItemCard } from "./GalleryItemCard";

type GalleryGridProps = {
  items: GalleryItem[];
};

export function GalleryGrid({ items }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <p className="font-display text-2xl font-semibold">Nothing here yet</p>
        <p className="font-body text-sm text-ink/70">No photos yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <GalleryItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Run it to confirm it passes**

Run: `npm test -- GalleryGrid.test`
Expected: 2 tests pass.

- [ ] **Step 9: Commit**

```bash
git add components/sections/GalleryItemCard.tsx components/sections/GalleryItemCard.test.tsx components/sections/GalleryGrid.tsx components/sections/GalleryGrid.test.tsx
git commit -m "feat: add GalleryItemCard and GalleryGrid"
```

---

## Task 11: Gallery Route

**Files:**
- Create: `app/gallery/layout.tsx`
- Create: `app/gallery/page.tsx`
- Create: `app/gallery/loading.tsx`
- Create: `app/gallery/loading.test.tsx`
- Create: `app/gallery/error.tsx`
- Create: `app/gallery/error.test.tsx`

**Interfaces:**
- Consumes: `Section`, `Heading` (Task 4, 5), `getGalleryItems`, `GalleryItem` (Task 9), `GalleryGrid` (Task 10), `Button` (Task 5).
- Produces: the `/gallery` route, with `layout.tsx` providing the shared heading and intro so `page.tsx`, `loading.tsx`, and `error.tsx` only render the state-specific inner content (grid, skeleton, or error message), per Next's route segment component hierarchy (`node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`).

`error.tsx` must be a Client Component and receives `{ error, retry }` in this Next.js version, not `{ error, reset }`.

- [ ] **Step 1: Create the shared gallery layout**

Create `app/gallery/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { Section } from "@/components/primitives/Section";
import { Heading } from "@/components/primitives/Heading";

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return (
    <Section>
      <Heading level={1}>The campaign in pictures</Heading>
      <p className="mt-4 max-w-xl font-body text-base text-ink/70">
        Photos and video from the trail across the Oyo South Senatorial District.
      </p>
      <div className="mt-12">{children}</div>
    </Section>
  );
}
```

- [ ] **Step 2: Create the gallery page**

Create `app/gallery/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getGalleryItems } from "@/content/gallery";
import { GalleryGrid } from "@/components/sections/GalleryGrid";

export const metadata: Metadata = {
  title: "Gallery | OTO for Senate",
  description: "Photos and video from the OTO for Senate campaign trail.",
};

export default async function GalleryPage() {
  const items = await getGalleryItems();
  return <GalleryGrid items={items} />;
}
```

This page is an `async` Server Component and is intentionally not unit-tested per this project's Vitest limitation; it is covered by the build check in Task 16 and by the already-tested `GalleryGrid` it renders.

- [ ] **Step 3: Write the failing loading test**

Create `app/gallery/loading.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Loading from "./loading";

describe("Gallery loading state", () => {
  test("renders an accessible loading skeleton", () => {
    render(<Loading />);
    expect(screen.getByLabelText("Loading gallery")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `npm test -- app/gallery/loading.test`
Expected: FAIL, `Cannot find module './loading'`.

- [ ] **Step 5: Implement the loading skeleton**

Create `app/gallery/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading gallery"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="aspect-[4/5] animate-pulse bg-ink/10 sm:aspect-square" />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Run it to confirm it passes**

Run: `npm test -- app/gallery/loading.test`
Expected: PASS.

- [ ] **Step 7: Write the failing error test**

Create `app/gallery/error.test.tsx`:

```tsx
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GalleryError from "./error";

describe("Gallery error state", () => {
  test("calls retry when the button is clicked", () => {
    const retry = vi.fn();
    render(<GalleryError error={new Error("failed")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 8: Run it to confirm it fails**

Run: `npm test -- app/gallery/error.test`
Expected: FAIL, `Cannot find module './error'`.

- [ ] **Step 9: Implement the error boundary**

Create `app/gallery/error.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/primitives/Button";

type GalleryErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function GalleryError({ error, retry }: GalleryErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-2xl font-semibold">Could not load the gallery</p>
      <p className="font-body text-sm text-ink/70">
        Something went wrong fetching photos and video.
      </p>
      <Button onClick={retry} tone="red" variant="solid">
        Try again
      </Button>
    </div>
  );
}
```

- [ ] **Step 10: Run it to confirm it passes**

Run: `npm test -- app/gallery/error.test`
Expected: PASS.

- [ ] **Step 11: Manual check in the browser**

Run: `npm run dev`, visit `http://localhost:3000/gallery`.
Expected: heading "The campaign in pictures", then the empty state "No photos yet. Check back soon." (since `getGalleryItems()` returns `[]`). Stop the dev server afterward.

- [ ] **Step 12: Commit**

```bash
git add app/gallery
git commit -m "feat: add the gallery route with loading and error states"
```

---

## Task 12: Home Page

**Files:**
- Create: `content/home.ts`
- Create: `components/sections/Hero.tsx`
- Create: `components/sections/TeaserCard.tsx`
- Create: `components/sections/CTABand.tsx`
- Modify: `app/page.tsx`
- Create: `app/page.test.tsx`
- Delete: `public/next.svg`, `public/vercel.svg`, `public/globe.svg`, `public/window.svg`, `public/file.svg`

**Interfaces:**
- Consumes: `Section`, `Heading`, `Button` (Tasks 4, 5).
- Produces: `Hero({ headline, intro })`, `TeaserCard({ title, body, href, linkLabel })`, and `CTABand({ title, body, href, linkLabel })`. `CTABand` is reused as-is by Task 15 (Get Involved has its own content but the same visual pattern is not reused there; Get Involved uses a numbered list instead, so no cross-task dependency beyond the primitives).

The old boilerplate `public/*.svg` files were only referenced by the default `app/page.tsx`, which this task fully replaces; delete them so the repository has no orphaned assets from the `create-next-app` template.

- [ ] **Step 1: Create the Home content**

Create `content/home.ts`:

```ts
export type Teaser = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export const homeContent = {
  headline: "Send someone who actually shows up.",
  intro:
    "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong twelve years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
  teasers: [
    {
      title: "The legislative agenda",
      body: "State police, a constitution that recognizes residency, a secular state, and a republic that actually federates.",
      href: "/agenda",
      linkLabel: "Read the agenda",
    },
    {
      title: "Who is OTO",
      body: "A Federal University of Technology, Minna graduate with an MSc from the University of Portsmouth, and no hunger for the avarice that passes for politics.",
      href: "/about",
      linkLabel: "Read the pedigree",
    },
    {
      title: "The campaign in pictures",
      body: "Photos and video from the trail across the Oyo South Senatorial District.",
      href: "/gallery",
      linkLabel: "See the gallery",
    },
  ] as Teaser[],
  closing: {
    title: "What we expect from you",
    body: "This campaign runs on people who talk to their neighbors, not just people who vote.",
    href: "/get-involved",
    linkLabel: "See how to help",
  },
};
```

- [ ] **Step 2: Create Hero**

Create `components/sections/Hero.tsx`:

```tsx
import { Heading } from "@/components/primitives/Heading";

type HeroProps = {
  headline: string;
  intro: string;
};

export function Hero({ headline, intro }: HeroProps) {
  return (
    <div className="flex flex-col gap-6 lg:max-w-4xl">
      <Heading level={1}>{headline}</Heading>
      <p className="font-body text-base text-ink/80 sm:text-lg lg:max-w-2xl">{intro}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create TeaserCard**

Create `components/sections/TeaserCard.tsx`:

```tsx
import { Button } from "@/components/primitives/Button";

type TeaserCardProps = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export function TeaserCard({ title, body, href, linkLabel }: TeaserCardProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-ink/10 pt-6">
      <h3 className="font-display text-xl font-semibold sm:text-2xl">{title}</h3>
      <p className="font-body text-sm text-ink/80 sm:text-base">{body}</p>
      <Button href={href} tone="red" variant="text" className="mt-1 self-start">
        {linkLabel}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Create CTABand**

Create `components/sections/CTABand.tsx`:

```tsx
import { Heading } from "@/components/primitives/Heading";
import { Button } from "@/components/primitives/Button";

type CTABandProps = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export function CTABand({ title, body, href, linkLabel }: CTABandProps) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <Heading level={3}>{title}</Heading>
        <p className="font-body text-sm text-ink-inverse/80 sm:text-base">{body}</p>
      </div>
      <Button href={href} tone="gold" variant="solid">
        {linkLabel}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Write the failing Home page test**

Create `app/page.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("Home page", () => {
  test("renders the headline and all three teasers", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Send someone who actually shows up." })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read the agenda/i })).toHaveAttribute("href", "/agenda");
    expect(screen.getByRole("link", { name: /read the pedigree/i })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: /see the gallery/i })).toHaveAttribute("href", "/gallery");
  });
});
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `npm test -- app/page.test`
Expected: FAIL, since `app/page.tsx` still renders the `create-next-app` boilerplate, not this headline.

- [ ] **Step 7: Replace the Home page**

Replace the full contents of `app/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { Hero } from "@/components/sections/Hero";
import { TeaserCard } from "@/components/sections/TeaserCard";
import { CTABand } from "@/components/sections/CTABand";
import { homeContent } from "@/content/home";

export const metadata: Metadata = {
  title: "OTO for Senate | Oyo South Senatorial District",
  description:
    "Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.",
};

export default function HomePage() {
  return (
    <>
      <Section>
        <Hero headline={homeContent.headline} intro={homeContent.intro} />
        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {homeContent.teasers.map((teaser) => (
            <TeaserCard key={teaser.href} {...teaser} />
          ))}
        </div>
      </Section>
      <Section tone="green">
        <CTABand {...homeContent.closing} />
      </Section>
    </>
  );
}
```

- [ ] **Step 8: Delete the orphaned boilerplate assets**

Run: `rm public/next.svg public/vercel.svg public/globe.svg public/window.svg public/file.svg`

- [ ] **Step 9: Run the test to confirm it passes**

Run: `npm test -- app/page.test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add -A content/home.ts components/sections/Hero.tsx components/sections/TeaserCard.tsx components/sections/CTABand.tsx app/page.tsx app/page.test.tsx public
git commit -m "feat: build the Home page"
```

---

## Task 13: About Page

**Files:**
- Create: `content/about.ts`
- Create: `components/sections/PedigreeBlock.tsx`
- Create: `app/about/page.tsx`
- Create: `app/about/page.test.tsx`

**Interfaces:**
- Consumes: `Section`, `Heading` (Tasks 4, 5).
- Produces: the `/about` route.

- [ ] **Step 1: Create the About content**

Create `content/about.ts`:

```ts
export type EducationEntry = {
  institution: string;
  detail: string;
};

export const aboutContent = {
  quote:
    "Basically, where are mine coming from to warrant you sending me on this delicate errand? Yes, you have brilliant ideas but can you do it? Do you have what it takes? The answer is yes. And yes.",
  character:
    "Quiet but resilient. Tough natured but good mannered and compassionate. OTO is a firm believer in equity who cannot in any way participate in the cheating of others, and has no hunger to join the avarice they call politics.",
  education: [
    {
      institution: "Federal University of Technology, Minna",
      detail: "Bachelor's degree with honours, class of 1992/93.",
    },
    {
      institution: "University of Portsmouth, United Kingdom",
      detail: "MSc, completed after a year of NYSC.",
    },
  ] as EducationEntry[],
};
```

- [ ] **Step 2: Create PedigreeBlock**

Create `components/sections/PedigreeBlock.tsx`:

```tsx
import type { EducationEntry } from "@/content/about";

type PedigreeBlockProps = {
  quote: string;
  character: string;
  education: EducationEntry[];
};

export function PedigreeBlock({ quote, character, education }: PedigreeBlockProps) {
  return (
    <div className="flex flex-col gap-10">
      <blockquote className="border-l-4 border-brand-gold pl-6 font-display text-2xl font-semibold leading-snug sm:text-3xl">
        {quote}
      </blockquote>
      <p className="max-w-2xl font-body text-base text-ink/80 sm:text-lg">{character}</p>
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {education.map((entry) => (
          <div key={entry.institution} className="border-t border-ink/10 pt-4">
            <dt className="font-display text-lg font-semibold">{entry.institution}</dt>
            <dd className="mt-1 font-body text-sm text-ink/70">{entry.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

- [ ] **Step 3: Write the failing About page test**

Create `app/about/page.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

describe("About page", () => {
  test("renders the heading and both education entries", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "What pedigree do you have?" })
    ).toBeInTheDocument();
    expect(screen.getByText("Federal University of Technology, Minna")).toBeInTheDocument();
    expect(screen.getByText("University of Portsmouth, United Kingdom")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `npm test -- app/about/page.test`
Expected: FAIL, `Cannot find module './page'`.

- [ ] **Step 5: Create the About page**

Create `app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { Heading } from "@/components/primitives/Heading";
import { PedigreeBlock } from "@/components/sections/PedigreeBlock";
import { aboutContent } from "@/content/about";

export const metadata: Metadata = {
  title: "About OTO | Oyo South Senatorial District",
  description: "The pedigree, education, and character behind OTO's candidacy for Oyo South.",
};

export default function AboutPage() {
  return (
    <Section>
      <Heading level={1}>What pedigree do you have?</Heading>
      <div className="mt-10">
        <PedigreeBlock {...aboutContent} />
      </div>
    </Section>
  );
}
```

- [ ] **Step 6: Run it to confirm it passes**

Run: `npm test -- app/about/page.test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add content/about.ts components/sections/PedigreeBlock.tsx app/about
git commit -m "feat: build the About page"
```

---

## Task 14: Agenda Page

**Files:**
- Create: `content/agenda.ts`
- Create: `components/sections/AgendaItem.tsx`
- Create: `app/agenda/page.tsx`
- Create: `app/agenda/page.test.tsx`

**Interfaces:**
- Consumes: `Section`, `Heading` (Tasks 4, 5).
- Produces: the `/agenda` route.

Per the responsive strategy, `AgendaItem` pairs the numeral beside the text on desktop and stacks them on mobile, with the numeral sized down deliberately rather than left to overflow.

- [ ] **Step 1: Create the Agenda content**

Create `content/agenda.ts`:

```ts
export type AgendaPoint = {
  number: string;
  title: string;
  body: string;
};

export const agendaIntro =
  "Most senators from Oyo South never answer this before they take their seat. Four years pass, and their names are never appended to any piece of legislation. Here is the agenda.";

export const agendaPoints: AgendaPoint[] = [
  {
    number: "01",
    title: "State police legislation",
    body: "Work with colleagues across all six geopolitical zones, and jointly with the Northern and Southern caucuses, to bring out legislation authorizing the creation of state police, starting with non-lethal arms and capped recruitment per population. In parallel, redraft the law setting up Civil Defence into six independent regional commands funded 30 percent federal and 70 percent state, answerable to each state governor.",
  },
  {
    number: "02",
    title: "Residency over state of origin",
    body: "Change the constitution to recognize residency rather than state of origin, so anyone who has lived their life in a state can claim legal residency, and their children become naturalized indigenes by birth. This eases ethnic tension, grows state treasuries, and fixes the population undercounts that distort infrastructure planning.",
  },
  {
    number: "03",
    title: "A secular Nigerian state",
    body: "Change the constitution to expressly provide for the secularity of the Nigerian state and remove religion from government policy, with punishment, including impeachment, for violations. Neighboring countries with comparable religious populations avoid Nigeria's tensions because their constitutions declare secular statehood outright.",
  },
  {
    number: "04",
    title: "Six zones as federating units",
    body: "Start with the six geopolitical zones as the federating units of the republic, each free to choose its own name, controlling its own education and economy, while the center retains a single foreign ministry, Army, immigration, and Central Bank, with one currency in regional variation.",
  },
];

export type BenefitGroup = {
  title: string;
  items: string[];
};

export const constituencyBenefits: BenefitGroup[] = [
  {
    title: "For the people",
    items: [
      "Scholarships to deserving students.",
      "Renovation of schools and classrooms, and provision of teaching aids.",
      "Fighting for adequate fertilizer supply to the Southern district, and syndicating loans for tractor purchases through farmer associations.",
    ],
  },
  {
    title: "For the roads",
    items: [
      "Reroute buses so they branch into inner roads instead of all starting and ending at the same two spots.",
      "Bring in investors for short-travel rail between Omi-Adio, Apata, Dugbe, Mokola, and Bodija.",
      "Bring in investors for multi-level car parking across Ibadan.",
      "Additional transformers to improve electricity supply across the district.",
    ],
  },
];
```

- [ ] **Step 2: Create AgendaItem**

Create `components/sections/AgendaItem.tsx`:

```tsx
import type { AgendaPoint } from "@/content/agenda";

type AgendaItemProps = {
  point: AgendaPoint;
};

export function AgendaItem({ point }: AgendaItemProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-ink/10 py-10 lg:flex-row lg:gap-10">
      <span className="font-display text-4xl font-semibold text-brand-red lg:w-32 lg:shrink-0 lg:text-6xl">
        {point.number}
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-xl font-semibold sm:text-2xl">{point.title}</h3>
        <p className="max-w-2xl font-body text-sm text-ink/80 sm:text-base">{point.body}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write the failing Agenda page test**

Create `app/agenda/page.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import AgendaPage from "./page";

describe("Agenda page", () => {
  test("renders the heading and all four agenda points", () => {
    render(<AgendaPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "When you get there, what do you have in mind for us?" })
    ).toBeInTheDocument();
    expect(screen.getByText("State police legislation")).toBeInTheDocument();
    expect(screen.getByText("Residency over state of origin")).toBeInTheDocument();
    expect(screen.getByText("A secular Nigerian state")).toBeInTheDocument();
    expect(screen.getByText("Six zones as federating units")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `npm test -- app/agenda/page.test`
Expected: FAIL, `Cannot find module './page'`.

- [ ] **Step 5: Create the Agenda page**

Create `app/agenda/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { Heading } from "@/components/primitives/Heading";
import { AgendaItem } from "@/components/sections/AgendaItem";
import { agendaIntro, agendaPoints, constituencyBenefits } from "@/content/agenda";

export const metadata: Metadata = {
  title: "The Agenda | OTO for Senate",
  description: "OTO's legislative agenda for the Oyo South Senatorial District.",
};

export default function AgendaPage() {
  return (
    <Section>
      <Heading level={1}>When you get there, what do you have in mind for us?</Heading>
      <p className="mt-6 max-w-2xl font-body text-base text-ink/80 sm:text-lg">{agendaIntro}</p>

      <div className="mt-12">
        {agendaPoints.map((point) => (
          <AgendaItem key={point.number} point={point} />
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
        {constituencyBenefits.map((group) => (
          <div key={group.title}>
            <h3 className="font-display text-xl font-semibold">{group.title}</h3>
            <ul className="mt-4 flex flex-col gap-3 font-body text-sm text-ink/80">
              {group.items.map((item) => (
                <li key={item} className="border-t border-ink/10 pt-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 6: Run it to confirm it passes**

Run: `npm test -- app/agenda/page.test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add content/agenda.ts components/sections/AgendaItem.tsx app/agenda
git commit -m "feat: build the Agenda page"
```

---

## Task 15: Get Involved Page

**Files:**
- Create: `content/get-involved.ts`
- Create: `app/get-involved/page.tsx`
- Create: `app/get-involved/page.test.tsx`

**Interfaces:**
- Consumes: `Section`, `Heading`, `Button` (Tasks 4, 5).
- Produces: the `/get-involved` route.

- [ ] **Step 1: Create the Get Involved content**

Create `content/get-involved.ts`:

```ts
export type Ask = {
  number: string;
  body: string;
};

export const getInvolvedAsks: Ask[] = [
  {
    number: "01",
    body: "Vote for the Zenith Labour Party across the board, and for OTO as your senator.",
  },
  {
    number: "02",
    body: "Talk to others about this opportunity to right past wrongs, and get everyone you convince to talk to at least ten more people.",
  },
  {
    number: "03",
    body: "Volunteer during the campaign: sponsor mini rallies, print posters and fliers for your neighborhood, and help at polling units on election day.",
  },
  {
    number: "04",
    body: "Help raise at least 1,000,000 votes for the Zenith Labour Party in the Presidential election, and at least 500,000 in the Oyo South Senatorial District.",
  },
];

export const campaignWebsite = "https://otoforsenate.ng/";
```

- [ ] **Step 2: Write the failing Get Involved page test**

Create `app/get-involved/page.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import GetInvolvedPage from "./page";

describe("Get Involved page", () => {
  test("renders the heading, all four asks, and the external site link", () => {
    render(<GetInvolvedPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "What we expect from you" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Vote for the Zenith Labour Party/)).toBeInTheDocument();
    expect(screen.getByText(/Help raise at least 1,000,000 votes/)).toBeInTheDocument();
    const siteLink = screen.getByRole("link", { name: /visit otoforsenate\.ng/i });
    expect(siteLink).toHaveAttribute("href", "https://otoforsenate.ng/");
    expect(siteLink).toHaveAttribute("target", "_blank");
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm test -- app/get-involved/page.test`
Expected: FAIL, `Cannot find module './page'`.

- [ ] **Step 4: Create the Get Involved page**

Create `app/get-involved/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { Heading } from "@/components/primitives/Heading";
import { Button } from "@/components/primitives/Button";
import { getInvolvedAsks, campaignWebsite } from "@/content/get-involved";

export const metadata: Metadata = {
  title: "Get Involved | OTO for Senate",
  description: "What the OTO campaign is asking of Oyo South voters.",
};

export default function GetInvolvedPage() {
  return (
    <Section>
      <Heading level={1}>What we expect from you</Heading>

      <div className="mt-12 flex flex-col">
        {getInvolvedAsks.map((ask) => (
          <div key={ask.number} className="flex gap-6 border-t border-ink/10 py-8">
            <span className="font-display text-3xl font-semibold text-brand-red sm:text-4xl">
              {ask.number}
            </span>
            <p className="max-w-xl font-body text-base text-ink/80 sm:text-lg">{ask.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Button href={campaignWebsite} tone="green" variant="solid">
          Visit otoforsenate.ng
        </Button>
      </div>
    </Section>
  );
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npm test -- app/get-involved/page.test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add content/get-involved.ts app/get-involved
git commit -m "feat: build the Get Involved page"
```

---

## Task 16: Full Verification Pass

**Files:** none created or modified; this task only runs checks.

**Interfaces:**
- Consumes: everything from Tasks 1 through 15.
- Produces: confidence that the whole site lints, type-checks, tests, and builds together, and that the golden path works in a real browser, before calling the foundation done.

- [ ] **Step 1: Run the linter**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Run the type checker**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: every test from Tasks 1 through 15 passes.

- [ ] **Step 4: Run a production build**

Run: `npm run build`
Expected: build succeeds, including the five routes (`/`, `/about`, `/agenda`, `/gallery`, `/get-involved`).

- [ ] **Step 5: Manual browser walkthrough**

Run: `npm run dev`. In a browser, visit each of `/`, `/about`, `/agenda`, `/gallery`, `/get-involved` at three widths: a phone width (around 375px), a tablet width (around 768px), and a desktop width (around 1280px). Confirm for each:
- Clash Display renders on headings, Switzer on body text (no fallback system font visible).
- No eyebrow or small uppercase label sits above any heading.
- The Nav collapses to the full-screen overlay menu below 1024px width, and the toggle opens and closes it.
- On `/gallery`, the empty state message is visible (there is no seed media yet).
- All internal links (Home teasers, Footer, Nav) navigate to the right page; the Get Involved external link opens `otoforsenate.ng` in a new tab.

Stop the dev server afterward.

- [ ] **Step 6: Commit if anything was fixed**

If Steps 1 through 5 required any fixes, stage and commit them individually per the convention used in earlier tasks. If everything already passed, there is nothing to commit for this task.

---

## REVISION 2026-08-04: One-Page Pivot

Client direction after reviewing the first homepage build: the site becomes a one-page landing plus the separate Gallery route. Tasks 13, 14, and 15 are CANCELLED as standalone routes; their content moves into the landing page. Task 16's verification steps that reference `/about`, `/agenda`, `/get-involved` as routes now apply to the same-named sections of `/` instead. The client will supply 5 to 6 photos of the candidate; the design must include image slots now that render as flat brand planes until the files arrive.

## Task 17: One-Page Home Rebuild

Supersedes Tasks 13, 14, 15. Design-sensitive task: run on the most capable model with the elevated-design mandate used for Task 12; the implementer has license over composition within the locked design rules. The homepage's existing hero treatment (poster plane, gold pick-out, ledger rows, diagonal cuts) is the visual language to extend, not replace.

**Files:**
- Create: `content/about.ts`, `content/agenda.ts`, `content/get-involved.ts` (typed content drawn faithfully from `docs/campaign-content.md`; keep them as separate files so future standalone pages can reuse them)
- Modify: `content/home.ts` (hero copy stays; teaser structure may change or go)
- Create: `components/primitives/CampaignImage.tsx` + test (optional `src`, required `alt`, renders a flat brand-color plane when `src` is absent; next/image when present; no stock/placeholder imagery ever)
- Create/modify section components as the design needs (e.g. PedigreeBlock, AgendaItem list, GetInvolvedList), composed from primitives
- Modify: `app/page.tsx` (the full one-page composition with section ids `about`, `agenda`, `get-involved`), `app/page.test.tsx`
- Modify: `components/layout/Nav.tsx` + test (links become `/#about`, `/#agenda`, `/#get-involved`, plus `/gallery`; active-link styling by pathname no longer applies to anchor links, adjust sensibly; mobile overlay pattern stays)
- Footer links: update to match the new IA (`/#...` anchors plus `/gallery`)

**Binding contract:**
- Section ids exactly `about`, `agenda`, `get-involved` on the landing page.
- All factual campaign content (names, degrees, party, vote targets, agenda specifics) faithful to `docs/campaign-content.md`; section intro copy may be crafted (striking, per design rule 8) but facts are locked.
- At least 5 CampaignImage slots woven into the page composition.
- Tests: Nav test asserts the four links' hrefs; page test asserts the h1, the three section ids exist, and one distinctive content assertion per section. Full suite green.
- All global constraints from this plan's Global Constraints section still bind (tokens only, no em dashes, no eyebrows, per-breakpoint restructuring where it helps, Server Components for the page, no co-author trailers in commits per the client rule added 2026-08-04).
- Client sign-off gate: the task is NOT complete when tests pass; it is complete when the client has seen the rendered page and approved it.

---
