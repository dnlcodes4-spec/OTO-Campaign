import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { Hero } from "@/components/sections/Hero";
import { PedigreeBlock } from "@/components/sections/PedigreeBlock";
import { AgendaLedger } from "@/components/sections/AgendaLedger";
import { PledgeGrid } from "@/components/sections/PledgeGrid";
import { GetInvolvedBlock } from "@/components/sections/GetInvolvedBlock";
import { VoteTargets } from "@/components/sections/VoteTargets";
import { homeContent } from "@/content/home";

export const metadata: Metadata = {
  title: "OTO for Senate | Oyo South Senatorial District",
  description:
    "Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.",
};

type PlaneTone = "surface" | "green" | "ink";

const PLANE_BG: Record<PlaneTone, string> = {
  surface: "bg-surface",
  green: "bg-brand-green",
  ink: "bg-brand-green-deep",
};

/*
 * The landing page is the whole site now: six flat planes meeting on
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
      </Section>
      <PlaneCut from="surface" to="ink" />
      <Section id="agenda" tone="ink">
        <AgendaLedger />
      </Section>
      <PlaneCut from="ink" to="surface" />
      <Section>
        <PledgeGrid />
      </Section>
      <PlaneCut from="surface" to="green" />
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
