import { Section } from "@/components/primitives/Section";
import { Hero } from "@/components/sections/Hero";
import { PedigreeBlock } from "@/components/sections/PedigreeBlock";
import { StoryTeaser } from "@/components/sections/StoryTeaser";
import { AtunlutoBlock } from "@/components/sections/AtunlutoBlock";
import { AgendaLedger } from "@/components/sections/AgendaLedger";
import { PledgeGrid } from "@/components/sections/PledgeGrid";
import { SenatorJob } from "@/components/sections/SenatorJob";
import { WatchBlock } from "@/components/sections/WatchBlock";
import { GetInvolvedBlock } from "@/components/sections/GetInvolvedBlock";
import { VoteTargets } from "@/components/sections/VoteTargets";
import { homeContent } from "@/content/home";

/*
 * No page-level metadata here: this route's title and description are
 * exactly the root layout's default (app/layout.tsx), so it inherits
 * them. Defining the same string again would run it through the
 * layout's title template a second time ("... | OTO for Senate | OTO
 * for Senate").
 */

type PlaneTone = "surface" | "green" | "ink";

const PLANE_BG: Record<PlaneTone, string> = {
  surface: "bg-surface",
  green: "bg-brand-green",
  ink: "bg-brand-green-deep",
};

/*
 * The landing page is the whole site now: seven flat planes meeting on
 * parallel diagonal cuts, the device the campaign's printed material uses,
 * so the scroll reads as one long poster rather than a stack of sections.
 * Each cut is a strip painted in the outgoing plane's color with the
 * incoming plane rising through it on the shared diagonal.
 */
function PlaneCut({ from, to }: { from: PlaneTone; to: PlaneTone }) {
  return (
    <div aria-hidden="true" className={`relative -my-px h-12 w-full sm:h-16 lg:h-24 ${PLANE_BG[from]}`}>
      <div
        className={`absolute inset-0 ${PLANE_BG[to]} [clip-path:polygon(0_100%,100%_0,100%_100%)]`}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Section tone="green">
        <Hero
          headline={homeContent.headline}
          intro={homeContent.intro}
          portrait={homeContent.portrait}
        />
      </Section>
      <PlaneCut from="green" to="surface" />
      <Section id="about">
        <PedigreeBlock />
        <StoryTeaser />
        <AtunlutoBlock />
      </Section>
      <PlaneCut from="surface" to="ink" />
      <Section id="agenda" tone="ink">
        <AgendaLedger />
      </Section>
      <PlaneCut from="ink" to="surface" />
      <Section>
        <PledgeGrid />
        <SenatorJob />
      </Section>
      {/*
       * The film plane: the written case is complete, so the candidate makes
       * it in his own voice before the page turns to the reader with its ask.
       * See WatchBlock for the full position and state rationale.
       */}
      <PlaneCut from="surface" to="ink" />
      <Section id="watch" tone="ink">
        <WatchBlock />
      </Section>
      <PlaneCut from="ink" to="green" />
      <Section id="get-involved" tone="green">
        <GetInvolvedBlock />
      </Section>
      <PlaneCut from="green" to="ink" />
      <Section tone="ink">
        <VoteTargets />
      </Section>
    </>
  );
}
