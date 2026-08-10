# Brief Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the site to the client's revised brief (OTO Brief.odt, 2026-08-09) per
`docs/superpowers/specs/2026-08-10-brief-sync-design.md`: expanded about section, new
SenatorJob and StoryTeaser blocks, a `/story` page, and the single 1M vote target.

**Architecture:** Content lives in `content/*.ts` typed objects; sections are server
components in `components/sections/` built from `Section`/`Heading`/`CampaignImage`
primitives; the landing page composes seven planes in `app/page.tsx`. New material lands
inside existing planes plus one new route `app/story/page.tsx`.

**Tech Stack:** Next.js (App Router, see `node_modules/next/dist/docs/` for this
version's conventions), Tailwind v4 tokens, Vitest + Testing Library.

## Global Constraints

- Copy voice: the site's editorial register — complete sentences, no em-dashes, no
  AI-generic filler. All faith content stays respectful and concrete.
- Brand tokens only: `brand-green`, `brand-green-deep`, `brand-red`, `brand-gold`,
  `ink`, `ink-inverse`, `surface`. No raw hex in components.
- Party name is always "Zenith Labour Party" (spec: Out of scope).
- No AI attribution in commits.
- Every task ends with the full suite green: `npx vitest run`.

---

### Task 1: Commit the shipped agenda work

The six-item agenda (brief items 1, 5, 6 + secularity/federating updates), two new
pictograms, and the WatchBlock test repair are done and verified but uncommitted.

**Files:** already-modified working tree files only.

- [ ] **Step 1:** `npx vitest run` — expect 85 passed.
- [ ] **Step 2:** Commit in two slices:

```bash
git add components/sections/WatchBlock.test.tsx
git commit -m "test: drop assertion on removed watch coming-detail copy"
git add content/agenda.ts components/graphics components/sections/AgendaLedger.tsx \
  components/sections/AgendaLedger.test.tsx app/page.test.tsx
git commit -m "feat: six-item legislative agenda from the revised brief"
```

### Task 2: Small content patches

**Files:**
- Modify: `content/home.ts` (intro), `content/agenda.ts` (census point),
  `content/atunluto.ts` (link, caucus line), `app/page.test.tsx:47-48` (link assertion).

**Steps:**

- [ ] **Step 1:** Update `app/page.test.tsx` link assertion to expect
  `https://www.atunluto.com` with accessible name `/atunluto\.com/`. Run
  `npx vitest run app/page.test.tsx` — expect FAIL (still renders .org).
- [ ] **Step 2:** Apply content edits:
  - `home.ts` intro: "…what went wrong twelve years ago." → "…what went wrong about
    eight years ago." (rest unchanged).
  - `agenda.ts` item 2: delete the "Fixes the census…" point.
  - `atunluto.ts`: `link` → `{ href: "https://www.atunluto.com", label: "atunluto.com" }`;
    `caucusLine` → "OTO comes to this race from the Atunluto caucus within the Zenith
    Labour Party: the Atunluto Group, a grassroots political association founded in Oyo
    State in March 2024 and focused on the Oyo South Senatorial District. Built as a
    resilient structure since then, it has grown into a major caucus in the Oyo Zenith
    Labour Party."
- [ ] **Step 3:** `npx vitest run` — expect all green.
- [ ] **Step 4:** `git add -A && git commit -m "content: hero timeline, census point, atunluto caucus and link per revised brief"`

### Task 3: Expanded Abuja answer + UK tie-ups (about)

**Files:**
- Modify: `content/about.ts`, `components/sections/PedigreeBlock.tsx`,
  `app/page.test.tsx` (about section assertions).

**Interfaces (produces):** `aboutContent.abujaRecord: string[]`,
`aboutContent.tieUps: { lead: string; pairs: { uk: string; ng: string }[] }`.

- [ ] **Step 1:** Add to `app/page.test.tsx` about-section test: assert the text
  "He has businesses across states" (substring match) and the heading-free row text
  "Cranfield University" render. Run — expect FAIL.
- [ ] **Step 2:** `content/about.ts` — add after `abujaSupport`:

```ts
abujaRecord: [
  "No godfather sent him. OTO has God for a godfather, is not poor, and is not in politics for what he can take out of it: there is a profitable 9-to-5 waiting for him when politics is done.",
  "Most people sent before now ran name-only businesses, no offices, no staff. He has businesses across states, run profitably, generating employment, without owing banks a dime.",
  "He has never sacked a staff member on account of bad times, not even now, when most companies are complaining.",
  "In business he deals faithfully and honestly: contracts kept going for over twenty years, and loyal customers of twenty-four.",
] as string[],
```

and after `education`:

```ts
tieUps: {
  lead: "He has led delegations from UK universities into tie-up agreements with Nigerian universities:",
  pairs: [
    { uk: "Cranfield University", ng: "University of Ibadan" },
    { uk: "Durham University", ng: "Covenant University" },
    { uk: "University of Portsmouth", ng: "Federal University of Technology, Minna" },
  ],
} as { lead: string; pairs: { uk: string; ng: string }[] },
```

- [ ] **Step 3:** `PedigreeBlock.tsx` — under the answer/support grid add a hairline
  record list, and after the education rows add the tie-up ledger:

```tsx
<ul className="mt-10 max-w-4xl divide-y divide-ink/10 border-t border-ink/10 sm:columns-2 sm:gap-10 sm:[column-fill:balance]">
  {aboutContent.abujaRecord.map((line) => (
    <li key={line} className="break-inside-avoid py-3 font-body text-sm leading-relaxed text-ink/70">
      {line}
    </li>
  ))}
</ul>
```

```tsx
<div className="mt-10 border-t-2 border-ink pt-6 sm:pt-8">
  <p className="max-w-xl font-body text-base leading-relaxed text-ink/70">
    {aboutContent.tieUps.lead}
  </p>
  <div className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-3">
    {aboutContent.tieUps.pairs.map((pair) => (
      <div key={pair.uk} className="border-t border-ink/15 pt-3">
        <p className="font-display text-lg font-semibold leading-tight">{pair.uk}</p>
        <p className="mt-1 font-body text-sm leading-relaxed text-ink/60">with {pair.ng}</p>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 4:** `npx vitest run` — green. Commit:
  `git commit -m "feat: expand the Abuja answer with the business record and UK tie-ups"`

### Task 4: SenatorJob block

**Files:**
- Create: `content/senator-job.ts`, `components/sections/SenatorJob.tsx`,
  `components/sections/SenatorJob.test.tsx`.
- Modify: `app/page.tsx` (render after PledgeGrid in the pledges Section).

**Interfaces (produces):** `senatorJobContent = { intro, segments: { number, title,
detail }[], challenge }`; `<SenatorJob />` server component.

- [ ] **Step 1:** Write `SenatorJob.test.tsx`: renders heading "So what does a senator
  actually do all day?", all four segment titles, and the challenge line. Run — FAIL.
- [ ] **Step 2:** `content/senator-job.ts`:

```ts
export type JobSegment = { number: string; title: string; detail: string };

export const senatorJobContent = {
  intro:
    "People look at the Senate and say the job should be part-time. That is a job-description problem, not a workload problem. The work divides into four measurable segments.",
  segments: [
    { number: "1", title: "Make the laws",
      detail: "Amendment of existing laws, repeal of the ones that have failed, enactment of new ones, and deliberation on the vital issues of national importance." },
    { number: "2", title: "Watch the budget",
      detail: "Scrutiny of the national budget, passage after amendments are proposed, then monitoring of its implementation, including approval of the instruments that make it work, like external and internal borrowing." },
    { number: "3", title: "Fight for the district's share",
      detail: "Constant correspondence and travel: writing state governments, ministries, departments and agencies, asking questions, demanding meetings. If 20,000 tractors are provided in the budget, someone must fight through for the 183 due to Oyo South. Even when allocations are not fully released, the one who fights gets some." },
    { number: "4", title: "Bring the investors",
      detail: "Direct financing of projects with commercial value: the mountain ranges from Idere to Aiyete and Tapa in Ibarapa could open Oyo South to the tourism industry. Every holiday directory lists The Gambia. We have as much here to turn into money." },
  ] as JobSegment[],
  challenge:
    "Now ask: which of these has the current crop done satisfactorily? And if those who did nothing in the House of Representatives are attempting the Senate, ask exactly what they will do differently.",
};
```

- [ ] **Step 3:** `SenatorJob.tsx` — second block of the pledges plane, same idiom as
  PedigreeBlock's second block (border-t-2 separator, red accent on the light plane):

```tsx
import { Heading } from "@/components/primitives/Heading";
import { senatorJobContent } from "@/content/senator-job";

export function SenatorJob() {
  return (
    <div className="mt-16 border-t-2 border-ink pt-12 sm:mt-20 lg:mt-24 lg:pt-16">
      <Heading level={2} sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight" className="max-w-3xl">
        So what does a senator actually <span className="text-brand-red">do</span> all day?
      </Heading>
      <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-ink/70 sm:text-lg lg:mt-12">
        {senatorJobContent.intro}
      </p>
      <ol className="mt-10 lg:mt-14">
        {senatorJobContent.segments.map((segment) => (
          <li key={segment.number} className="grid grid-cols-[auto_1fr] gap-x-6 border-t-2 border-ink py-6 sm:py-8 lg:gap-x-10">
            <p className="font-display text-3xl font-semibold leading-none text-brand-red sm:text-4xl">{segment.number}</p>
            <div>
              <Heading level={3} sizeOverride="text-2xl sm:text-3xl leading-tight">{segment.title}</Heading>
              <p className="mt-2 max-w-3xl font-body text-base leading-relaxed text-ink/70">{segment.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-10 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-tight text-brand-green sm:text-3xl">
        {senatorJobContent.challenge}
      </p>
    </div>
  );
}
```

- [ ] **Step 4:** Wire into `app/page.tsx` pledges Section, after `<PledgeGrid />`.
- [ ] **Step 5:** `npx vitest run` — green. Commit:
  `git commit -m "feat: add the senator job-description block"`

### Task 5: Story content + StoryTeaser

**Files:**
- Create: `content/story.ts`, `components/sections/StoryTeaser.tsx`,
  `components/sections/StoryTeaser.test.tsx`.
- Modify: `app/page.tsx` About plane: Pedigree → StoryTeaser → Atunluto.

**Interfaces (produces):** `storyContent.teaser = { paragraphs: string[], cta, href }`;
`storyContent.page = { title, lead, sections: { heading, body: string[] }[], closing:
{ line, cta, href } }`; `<StoryTeaser />`.

- [ ] **Step 1:** `StoryTeaser.test.tsx`: renders heading "But who is OTO?", first
  teaser paragraph, and a link named "Read the full story" with href "/story". Run — FAIL.
- [ ] **Step 2:** `content/story.ts` with teaser (3 paragraphs, below) and the full
  page content (six sections: Eruwa childhood; Minna/Kano/Portsmouth; the dream and its
  three assignments; the two wars won — business, siblings, Glory Educational Services
  and the UK recruitment years; the quiet giving — 75,000-naira scholarships and the 50
  widows; the third assignment — 2021 reminder, Labour Party 2022, the 2023 contest,
  regrouping into ZLP). Teaser paragraphs:
  1. "Born in Eruwa 58 years ago to two teachers whose salaries could not always feed
     the house, OTO read quantity surveying at the Federal University of Technology,
     Minna, and reached the United Kingdom on an uncle's half-paid tuition and years of
     back-breaking work for the rest."
  2. "What turned the business he built there into a calling was a dream with three
     assignments: win the war over poverty for yourself, for your family, for your
     people. The first two are won. The third is why he is on your ballot."
  3. "He gives the way he wished someone had given to him: scholarships of 75,000 naira
     a semester with no cameras invited, and cash gifts to fifty widows this September
     that he refused to let the party televise."
- [ ] **Step 3:** `StoryTeaser.tsx` — separated block in the About plane (border-t-2,
  heading with red accent, paragraphs in two balanced columns, CTA link in brand-green
  display type with the light-plane focus ring).
- [ ] **Step 4:** Render between `<PedigreeBlock />` and `<AtunlutoBlock />`.
- [ ] **Step 5:** `npx vitest run` — green. Commit:
  `git commit -m "feat: add the condensed who-is-OTO story to the about plane"`

### Task 6: /story page + nav + sitemap

**Files:**
- Create: `app/story/page.tsx`, `app/story/page.test.tsx`.
- Modify: `components/layout/Nav.tsx` LINKS (add `{ href: "/story", label: "Story" }`
  after About), `app/sitemap.ts` (add `/story`, changeFrequency "monthly", priority
  0.7), `app/sitemap.test.ts` (expect the new entry).

- [ ] **Step 1:** `app/story/page.test.tsx`: renders h1 from `storyContent.page.title`
  content, every section heading, and the closing link back to `/#agenda`. Run — FAIL.
- [ ] **Step 2:** `app/story/page.tsx`: metadata `{ title: "The OTO Story",
  description: "Who Oluwasegun Theophilus Oladimeji is: the Eruwa childhood, the calling, and the road to the Zenith Labour Party ticket." }`.
  Structure: green Section with h1 and lead; surface Section with the six prose
  sections (Heading level 2 + paragraphs, max-w-2xl, hairline separators); closing line
  and a link to `/#agenda` ("Read what he intends to do with the seat").
- [ ] **Step 3:** Nav + sitemap edits; update `app/sitemap.test.ts` expectations.
- [ ] **Step 4:** `npx vitest run` — green. Commit:
  `git commit -m "feat: add the full story page with nav and sitemap entries"`

### Task 7: Single vote target + get-involved updates

**Files:**
- Modify: `content/get-involved.ts`, `components/sections/VoteTargets.tsx`,
  `app/page.test.tsx` (targets assertions).

**Interfaces (produces):** `getInvolvedContent.targets` shrinks to one entry;
new `getInvolvedContent.targetsSupport: string`.

- [ ] **Step 1:** Update `app/page.test.tsx`: expect exactly one target figure
  "1,000,000" with the Oyo South label, no "500,000", and the support line. Run — FAIL.
- [ ] **Step 2:** `get-involved.ts`:
  - asks[0].detail: "Vote for the Zenith Labour Party across the board in the 2027
    election, and for OTO as your senator."
  - asks[2].detail: "Volunteer to help out during the campaign and at the polling units
    on election day. We need a sea of volunteers."
  - turnoutStats[1].figure: "1 in 4".
  - targets: `[{ figure: "1,000,000", label: "votes for the Zenith Labour Party at the Oyo South Senatorial District." }]`
  - new `targetsSupport: "No matter how bad it gets, from this target there is enough to win it."`
- [ ] **Step 3:** `VoteTargets.tsx`: keep the map (one entry renders one row), render
  `targetsSupport` after the rows in the epigraph's quiet register but body type:
  `<p className="mt-6 max-w-xl font-body text-base leading-relaxed text-ink-inverse/60">`.
  Drop the alternating right-step class logic only if it reads as dead code with one
  entry; keep the map itself.
- [ ] **Step 4:** `npx vitest run` — green. Commit:
  `git commit -m "feat: single million-vote target and 2027 get-involved copy"`

### Task 8: Full verification and sign-off evidence

- [ ] **Step 1:** `npx vitest run` (all), `npx tsc --noEmit`, `npm run build`.
- [ ] **Step 2:** `npm run dev`, full-page screenshots of `/` and `/story` via
  Playwright CLI + system Chrome (the working recipe:
  `npx -y playwright screenshot --browser chromium --channel chrome --full-page --viewport-size "1440,900" --wait-for-timeout 4000 <url> <out.png>`),
  slice with sips, inspect every new block visually.
- [ ] **Step 3:** Present screenshots for client sign-off. Not done until the client
  has seen the rendered UI.
