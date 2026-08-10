# Brief Sync: New Campaign Brief onto the Site

**Date:** 2026-08-10
**Source of truth:** `OTO Brief.odt` (client's revised brief, 2026-08-09). Supersedes
`docs/oto.docx` for every section it covers.
**Status:** Approved by client (via DNLCodess) — single vote target, condensed story on
landing with full story on its own page, atunluto.com link (verified live, HTTP 200).

The six-item legislative agenda from the same brief already shipped (items 1, 5, 6 and
the secularity/federating updates). This spec covers everything else the brief changes.

## Decisions taken

1. **Vote targets** — replace the two targets (1M presidential + 500K senatorial) with
   the brief's single target: **1,000,000 votes for ZLP at Oyo South**, supported by the
   brief's line "no matter how bad, from this target we have enough to win it."
2. **Bio depth** — condensed story on the landing page; a new `/story` page carries the
   full narrative; the teaser links to it.
3. **Atunluto URL** — switch to `https://www.atunluto.com` (brief's URL; confirmed live).
4. **Structure** — Approach 1: landing page keeps its seven-plane poster structure; new
   material lands inside existing planes. No new landing-page planes.

## Content changes (`content/`)

- **home.ts** — intro: "twelve years ago" → "eight years ago" (brief wording).
- **about.ts** — expand the Abuja answer beyond "hardworking": no godfather but God;
  businesses run profitably across states, generating employment, without owing banks;
  never sacked a staff member in bad times; a profitable 9-to-5 to return to after
  politics; contracts kept over twenty years, customers loyal for twenty-four; deals
  faithfully and honestly. Pedigree gains the UK tie-ups OTO brokered: Cranfield–Univ.
  of Ibadan, Durham–Covenant, Portsmouth–FUT Minna, plus the delegation-leading line.
- **agenda.ts** — remove the census point from item 2 (dropped in the new brief).
- **senator-job.ts (new)** — the senator's job in four segments: (1) lawmaking —
  amendments, repeals, new laws, deliberation; (2) oversight — budget scrutiny, passage,
  implementation monitoring, borrowing approvals; (3) constituency liaison — the
  correspondence war ("if 20,000 tractors are in the budget, fight through for the 183
  due to Oyo South"); (4) investors — commercial projects like the Idere–Aiyete/Tapa
  mountain ranges and the tourism case (the Gambia comparison). Framed by the brief's
  point: people call the Senate part-time only because nobody told them the job
  description, and the standing challenge "which of these has the current crop done
  satisfactorily?"
- **story.ts (new)** — teaser (condensed story + link label) and full-page content:
  born in Eruwa 58 years ago; Baptist Day School and Obaseeku High School; teacher
  parents, poverty, the Shagari-era withheld salaries; FUT Minna quantity surveying (the
  six-year B.Tech set); NYSC in Kano; the uncle who paid half the UK tuition; the 1998
  dream and its three assignments (win the war over poverty for yourself, your family,
  your people) with the 1992 dream as its antecedent; the business, the siblings brought
  to the UK; Glory Educational Services and the UK university recruitment years; the
  quiet giving — 75,000-naira-per-semester scholarships with no cameras, the 50 widows;
  the 2021 reminder; joining the Labour Party in 2022 (first party ever), the 2023
  contest, the powers moving against LP, regrouping into the Zenith Labour Party.
- **get-involved.ts** — ask 1 names "the 2027 election"; ask 3 simplified to the brief's
  volunteer wording (campaign + polling units, "a sea of volunteers"); ask 4 (Atunluto
  cooperative funding) stays — it comes from Atunluto research the brief doesn't
  contradict; targets collapse to the single 1M figure with the support line; turnout
  stat "1 in 3" corrected to "1 in 4" (a million active of four million registered — the
  brief's own numbers).
- **atunluto.ts** — link → atunluto.com; caucus line notes the group became a major
  caucus in the Oyo ZLP, built as a resilient structure since 2024.

## Landing page (`app/page.tsx`)

Seven planes unchanged. Two blocks added inside existing planes:

- **StoryTeaser (new component)** — About plane, between PedigreeBlock and
  AtunlutoBlock. Reading order of the plane becomes: can he do it (pedigree) → who is
  he (story) → where is his structure (Atunluto). Ends in a "Read the full story" link
  to `/story`.
- **SenatorJob (new component)** — pledges plane, after PledgeGrid. Four numbered
  segments in the ledger idiom on the light surface, answering "what does a senator
  actually do all day?" right after "what is an honest senator worth at home?".

## /story page (`app/story/page.tsx`)

New route with its own metadata (title "The OTO Story"). Long-form prose in the site's
typography: green title plane, narrative sections on the surface plane, closing with a
link back to the home page's agenda. Built from existing primitives (Section, Heading);
no new design-system pieces. Nav gains a "Story" item.

## Testing

- Update `app/page.test.tsx`: single vote target, StoryTeaser and SenatorJob present,
  teaser links to /story.
- New test files for StoryTeaser, SenatorJob, and the story page, following the current
  component-test patterns (content renders from the content file, links resolve).
- Existing suites must stay green (85 tests today).

## Out of scope

- The film/watch plane, gallery, pledges list — untouched by the brief.
- The brief's "Welcome" wording that says "Labour Party" — the brief itself uses Zenith
  Labour Party everywhere else; the site keeps ZLP.

## Sign-off

Render both pages and screenshot before calling done; the client sees the rendered UI
first (standing sign-off gate).
