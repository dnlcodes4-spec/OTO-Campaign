# OTO for Senate: Site Foundation Design

Date: 2026-08-04
Status: Approved, ready for implementation planning

## Purpose

Design the public-facing campaign site for Oluwasegun Theophilus Oladimeji ("OTO"), Zenith Labour Party candidate for the Oyo South Senatorial District. This spec covers the site's information architecture, brand foundation, and component/data architecture so it can absorb ongoing client feedback (new pages, new sections, content edits) without breaking existing pages.

## Scope

This is the first of two specs, decided together with the client:

- **This spec (Site Foundation):** the public site's pages, design system, component architecture, and the gallery page's *display* side.
- **Follow-up spec (Gated Admin and Upload):** authentication, media storage, and the upload pipeline that feeds the gallery. Deferred so its infrastructure choices (auth provider, storage provider) can be made once this foundation's conventions exist, instead of guessing ahead of time.

The gallery page is built in this spec against a defined data interface (see "Gallery Data Interface" below) so the second spec only has to implement that interface, not touch the gallery UI.

Explicitly out of scope for this spec: authentication, a database, file storage, a functional Get Involved form (client confirmed informational-only for now), and a CMS (client confirmed content is developer-managed, not client-editable).

## Design Rules

These apply to every page and component built under this spec (full rationale in project memory, `feedback_design_standards`):

1. No AI-generic styling or iconography (no sparkle icons, no templated visual cliches).
2. No em dashes anywhere, in UI copy or documentation.
3. No generic design; every component needs an intentional decision behind it.
4. Full responsiveness: some components restructure per breakpoint, not just scale fluidly.
5. Loading, error, and pending states are part of the spec for any async UI, not an afterthought.
6. Design choices are justified against the site's purpose (electing OTO) at a senior frontend engineer's standard.
7. No eyebrows or small uppercase labels above headings or on components.
8. Headings, captions, and all copy must be striking, not safe or templated.

## Brand Foundation

**Color palette** (full detail and sourcing in project memory, `project_oto_brand_palette`):

| Token | Hex | Role |
|---|---|---|
| Primary Green | `#0B622F` | Nav, wordmark, primary links, section heads |
| Green Bright | `#009846` | Hover and active states |
| Green Deep | `#132D1F` | Dark-mode ground, footer |
| Primary Red | `#E31E24` | Primary calls to action |
| Red Pressed | `#C92223` | Button hover and active |
| Party Gold | `#F5B700` | Highlights, tags, stat callouts, badges |
| Gold Deep | `#C9A227` | Gold hover and pressed, borders on gold fills |
| Surface | `#F7F8F9` | Page background |
| Ink | `#2B2A29` | Body text |
| Ink Inverse | `#FEFEFE` | Text on green or red grounds |

**Typography** (full detail in project memory, `project_oto_typography`):

- **Display and headlines:** Clash Display (Fontshare), set large, carries the page's personality.
- **Body, labels, buttons:** Switzer (Fontshare), neutral grotesk, stays out of Clash Display's way.

This pairing was chosen after two rounds of more conventional Google Fonts pairings (Fraunces/Public Sans, Archivo Expanded/Source Sans 3, Roboto Slab/Work Sans, then Instrument Serif, Bricolage Grotesque, Libre Caslon Display) were rejected as too safe. Clash Display and Switzer are not defaults commonly reached for, and were confirmed directly by the client.

## Information Architecture

Five pages, one persistent shell (nav plus footer, no eyebrow-style branding chrome):

| Route | Purpose | Source content |
|---|---|---|
| `/` (Home) | Landing and funnel page: high-impact intro plus teasers into Agenda, About, Gallery, closing call to action into Get Involved. No page owns duplicate copy; Home only excerpts and links. | Welcome section of `docs/campaign-content.md` |
| `/about` | Candidate pedigree, education, character. | "What Pedigree Do You Have" section |
| `/agenda` | Legislative agenda: state police legislation, residency-over-origin constitutional change, secular-state amendment, six-zone restructuring, plus constituency development pledges. Longest, most structured page. | "When You Get There" and "Constituency Benefits" sections |
| `/gallery` | Displays campaign images and videos. Built against a data interface with seed content now; wired to real uploads once the admin spec ships. | New, no docx source |
| `/get-involved` | What is asked of supporters (vote, talk to others, volunteer, vote targets), informational only, outbound links to social/WhatsApp. No data-collecting form in this spec. | "What Do We Expect From You" section |

## Component Architecture

```
app/
  layout.tsx              root shell: fonts, nav, footer
  page.tsx                Home
  about/page.tsx
  agenda/page.tsx
  gallery/page.tsx
  get-involved/page.tsx

components/
  primitives/              Button, Container, Heading, Section, Link
  sections/                 Hero, AgendaItem, PedigreeBlock, GalleryGrid,
                            GalleryItem, CTABand
  layout/                  Nav, Footer

content/
  home.ts                  typed content for Home's teasers
  about.ts
  agenda.ts                typed array of agenda items (title, body, order)
  get-involved.ts
  gallery.ts               getGalleryItems(), the interface boundary

lib/
  tokens.ts / globals.css   color, type, spacing tokens as CSS custom properties
```

Route files only compose section components and pass them content from the matching `content/*.ts` file. No page hand-rolls a one-off button or heading style; a need not covered by an existing primitive becomes a new, reusable primitive or section component instead of a page-local hack. This is the mechanism that keeps client feedback from breaking unrelated pages: changing a token or a shared component propagates everywhere it is used, and page-specific changes stay contained to that page's content file.

### Gallery Data Interface

`content/gallery.ts` exports one function:

```ts
type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string;
  createdAt: string;
};

function getGalleryItems(): Promise<GalleryItem[]>;
```

For this spec, it returns an empty array. No placeholder or stock images ship in its place: the campaign's real photos and videos do not exist in this repository yet (the images extracted from `docs/oto.docx` were reviewed and discarded as unusable), and inventing stand-in imagery would need to be found and removed later for no benefit. Returning `[]` also means the Gallery page's empty state (see "UI States" below) is exercised for real from day one, not just in theory. The follow-up admin spec swaps this function's internals to read from real storage once media exists. `GalleryGrid` and `/gallery` depend only on the shape of `GalleryItem[]`, never on where it comes from, so the second spec's implementation does not touch this spec's UI code.

## Responsive Strategy

Breakpoints follow Tailwind's defaults: mobile under 640px, tablet 640 to 1024px, desktop above 1024px. Per design rule 4, some components restructure rather than only scale:

- **Nav** — full inline links on desktop; on mobile, a full-screen overlay menu triggered by a menu control, not squeezed-down inline links, since a Clash Display wordmark plus five nav links will not survive a naive scale-down.
- **Hero (Home)** — desktop uses the large-scale Clash Display treatment; mobile gets a deliberately different scale and line-break rhythm, not `clamp()` alone, so headlines still land on a small screen.
- **GalleryGrid** — desktop uses a multi-column grid with hover-revealed captions; mobile has no hover, so captions need an always-visible or tap-revealed treatment, and column count drops with intent rather than auto-wrapping.
- **AgendaItem** — desktop pairs a large numeral beside the text; mobile stacks them, with the numeral sized down deliberately rather than overflowing.

## UI States

Home, About, Agenda, and Get Involved are static, developer-managed content rendered at build time; they do not need runtime loading states. Gallery is the exception, since `getGalleryItems()` is async by design even against seed data now:

- **Loading** — skeleton grid placeholders while `getGalleryItems()` resolves.
- **Empty** — an explicit empty state ("no photos yet, check back soon"), plausible before the admin spec ships any media.
- **Error** — a clear message with a retry action if the fetch fails, not a silent blank grid.
- **Per-item** — each image or video gets its own broken-media fallback, so one bad URL does not break the whole grid.

## Testing

- TypeScript strict mode and ESLint as the baseline gate (already configured in the project).
- Component tests (Vitest plus React Testing Library) for primitives and for GalleryGrid's loading, empty, and error states specifically, since those are the components most likely to have real runtime bugs.
- Static content pages (Home, About, Agenda, Get Involved) are verified by build success plus manual review, since they render fixed content with no branching logic to unit test.

## Extensibility

When the client requests a new page or section in a future conversation:

1. Add a typed content file under `content/` if it holds page-specific copy.
2. Compose it from existing primitives and section components first; only add a new section component if nothing existing fits.
3. If a new visual pattern is genuinely needed, it becomes a primitive or section component, reviewed against the design rules above, not a one-off inline style on a single page.
4. Colors and type never get hardcoded per-component; they reference the tokens defined in `lib/tokens.ts` / `globals.css`.

This keeps the site's surface area growable without the token-and-component foundation drifting or breaking pages that were not part of the requested change.
