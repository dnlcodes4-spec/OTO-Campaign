# OTO for Senate: Launch Polish Plan

Date: 2026-08-05
Status: In progress

## Context

The site foundation merged as PR #1. The client has since supplied real assets in `docs/assets/` (untracked; large originals stay out of git):

- `Oto Logo.png` (1532x1532, RGBA): round green mark, white swoosh. The campaign's actual logo.
- `OTO picture native.png` (2767x3511, RGBA cut-out): candidate in gold agbada and fila.
- `OTO picture suit 1.png` (5341x4123, RGBA cut-out): grey suit, landscape crop.
- `OTO picture suit 2.png` (4776x5259, RGBA cut-out): navy pinstripe, near-square crop.

All four have genuine alpha (verified corner pixels transparent), so portraits composite directly onto brand planes. Only three photos exist (down from the planned 5 to 6), so the page's five image slots get recomposed deliberately.

This plan covers the client's three asks, in order: wire in the real assets, elevate text-heavy sections with custom SVG communication, then close the pre-launch follow-ups from the final review.

## Global Constraints

All locked project rules apply unchanged (see `docs/superpowers/plans/2026-08-04-site-foundation.md` Global Constraints, plus project memory): tokens only, no em dashes, no eyebrows, no AI-generic patterns, per-breakpoint restructuring, TDD per task, Server Components by default, no Co-Authored-By trailers or AI attribution in commits, and the client sign-off gate for all UI work.

Additional rules for this plan:

- **No icon-library look.** Custom SVGs are drawn for this site in its own visual language (flat planes, hard edges, diagonal cuts, brand tokens). Nothing that could be mistaken for Heroicons/Feather/FontAwesome output. SVGs inherit color via `currentColor` or CSS custom properties, never hardcoded hex.
- **Image discipline.** Web-ready derivatives live in `public/images/` (longest side 1600px, alpha preserved, PNG). Originals stay untracked in `docs/assets/` (gitignored). `next/image` handles responsive derivatives at runtime; every `<Image>` gets an accurate `sizes` attribute and `alt` sourced from content files.

## Design Decisions (controller-made, subject to client sign-off)

- **Hero:** native-attire portrait. The gold agbada against the green hero plane is the strongest identity statement and matches the party gold pick-outs.
- **About/pedigree:** suit 2 (navy pinstripe, near-square) beside the legal-name treatment.
- **Get involved/closing:** suit 1 (grey suit, landscape) grounding the volunteer ask.
- **Remaining two slots:** recomposed away or kept as intentional planes only where pacing needs them; the implementer decides per-section and documents the choice.
- **Logo:** nav wordmark pairing, footer, favicon set, and the OG image.

## Task 18: Photos and Logo Integration

**Files:**
- Create: `public/images/oto-native.png`, `public/images/oto-suit-1.png`, `public/images/oto-suit-2.png`, `public/images/oto-logo.png` (web-ready derivatives, prepared by the controller before dispatch)
- Modify: `content/home.ts`, `content/about.ts`, `content/get-involved.ts` (image src + alt fields move into content; PedigreeBlock's hardcoded alt moves here, closing final-review triage item 4)
- Modify: `components/primitives/CampaignImage.tsx` + test (accept content-driven src/alt; keep the flat-plane fallback for src-less slots; `next/image` with `sizes`)
- Modify: `components/sections/Hero.tssx`, `PedigreeBlock.tsx`, get-involved section component, `app/page.tsx` as the composition needs
- Modify: `components/layout/Nav.tsx`, `Footer.tsx` (logo mark beside the wordmark; keep type-first identity, the mark supports rather than replaces)

**Binding contract:**
- Three photos placed per Design Decisions; no slot renders a broken or empty image; removed slots leave no dead code.
- All alt text lives in content files, none hardcoded in components.
- Tests updated: CampaignImage covers photo-present and plane-fallback paths; page test asserts the three images render with their content-file alt text.
- Full suite green, tsc clean, lint clean.

## Task 19: Custom SVG Elevation

**Files:**
- Create: `components/graphics/` (one file per pictogram, plus a shared README comment block in the directory's index if helpful)
- Modify: `components/sections/AgendaLedger.tsx` (or equivalent), optionally the pledges section

**Binding contract:**
- One custom pictogram per legislative agenda item (state police, residency, secular state, six federating zones), drawn in the site's own geometry: flat shapes, hard edges, the diagonal-cut motif, no strokes-and-rounded-caps icon grammar.
- Color via `currentColor`/tokens only; pictograms read correctly on both light and deep-green planes.
- `aria-hidden` on decorative SVGs; the text still carries all meaning.
- Per-breakpoint: pictograms scale with intent (visible and balanced on mobile, not squeezed).
- Tests: agenda section test asserts the four pictograms render (by test id), full suite green.

## Task 20: Mobile Menu Accessibility

**Files:**
- Modify: `components/layout/Nav.tsx` + test, `components/primitives/Button.tsx` + test

**Binding contract (closes final-review triage items 3 and 9):**
- Overlay gets `role="dialog"` and `aria-modal="true"`; background content made `inert` while open (with a focus-trap loop fallback if `inert` support gaps demand it).
- Tab and Shift+Tab cycle within the open menu; Escape and breakpoint-crossing behavior unchanged.
- Branded `focus-visible` treatment on Button and nav/footer links (brand-gold ring or equivalent token-based treatment, visible on all plane tones).
- Tests: focus containment (Tab from last element wraps to first), inert background assertion, focus-visible class presence. Full suite green.

## Task 21: SEO Package

**Files:**
- Create: `app/opengraph-image.tsx` (1200x630, generated: brand green plane, logo mark, candidate name and district in Clash Display), `app/sitemap.ts`, `app/robots.ts`, favicon set (`app/icon.png` sizes from the logo, `app/apple-icon.png`), replace `app/favicon.ico`
- Modify: `app/layout.tsx` (metadataBase, title template, description, openGraph and twitter fields), `app/gallery/page.tsx` (page-level metadata)

**Binding contract (closes final-review issues 2 and 3):**
- `metadataBase` set from a single site-URL constant (env-overridable, defaulting to the production domain `https://otoforsenate.ng`).
- OG/Twitter cards render title, description, and the generated image; WhatsApp link preview works (og:image absolute URL).
- Sitemap lists `/` and `/gallery`; robots allows all and points at the sitemap.
- Favicon: the logo mark, correct at 16/32/180/512.
- Build succeeds; curl checks confirm the meta tags and image route respond.

## Task 22: Verification and Sign-off

- `npx tsc --noEmit`, `npm test`, `npm run lint`, `npm run build`, production curl checks (meta tags, images, both routes).
- Dev server for the client; sign-off gate per project rule before anything is marked complete.
