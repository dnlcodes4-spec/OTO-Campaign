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
import { getHomeContent } from "@/content/home";
import { getSiteContentData } from "@/content/site";
import { getSenatorJobContent } from "@/content/senator-job";
import { getWatchContent, watchContentDefault } from "@/content/watch";
import { getAboutContent } from "@/content/about";
import { getGetInvolvedContent } from "@/content/get-involved";
import { getAtunlutoContent } from "@/content/atunluto";
import { getStoryContent } from "@/content/story";
import { getAgendaContent } from "@/content/agenda";

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

export default async function HomePage() {
  const [
    homeContent,
    { partyLogo },
    senatorJobContent,
    watchContent,
    aboutContent,
    getInvolvedContent,
    atunlutoContent,
    storyContent,
    agendaContent,
  ] = await Promise.all([
    getHomeContent(),
    getSiteContentData(),
    getSenatorJobContent(),
    getWatchContent(),
    getAboutContent(),
    getGetInvolvedContent(),
    getAtunlutoContent(),
    getStoryContent(),
    getAgendaContent(),
  ]);
  return (
    <>
      <Section tone="green">
        <Hero
          headline={homeContent.headline}
          intro={homeContent.intro}
          portrait={homeContent.portrait}
          partyLogo={partyLogo}
        />
      </Section>
      <PlaneCut from="green" to="surface" />
      <Section id="about">
        <PedigreeBlock
          nameParts={aboutContent.nameParts}
          nameNote={aboutContent.nameNote}
          portrait={aboutContent.portrait}
          abujaAnswer={aboutContent.abujaAnswer}
          abujaSupport={aboutContent.abujaSupport}
          abujaRecord={aboutContent.abujaRecord}
          character={aboutContent.character}
          quote={aboutContent.quote}
          education={aboutContent.education}
          tieUps={aboutContent.tieUps}
        />
        <StoryTeaser
          paragraphs={storyContent.teaser.paragraphs}
          cta={storyContent.teaser.cta}
          href={storyContent.teaser.href}
        />
        <AtunlutoBlock
          answer={atunlutoContent.answer}
          caucusLine={atunlutoContent.caucusLine}
          model={atunlutoContent.model}
          stats={atunlutoContent.stats}
          running={atunlutoContent.running}
          pillars={atunlutoContent.pillars}
          link={atunlutoContent.link}
        />
      </Section>
      <PlaneCut from="surface" to="ink" />
      <Section id="agenda" tone="ink">
        <AgendaLedger intro={agendaContent.intro} items={agendaContent.items} />
      </Section>
      <PlaneCut from="ink" to="surface" />
      <Section>
        <PledgeGrid
          pledgesPull={agendaContent.pledgesPull}
          pledgesIntro={agendaContent.pledgesIntro}
          pledges={agendaContent.pledges}
        />
        <SenatorJob
          intro={senatorJobContent.intro}
          segments={senatorJobContent.segments}
          challenge={senatorJobContent.challenge}
        />
      </Section>
      {/*
       * The film plane: the written case is complete, so the candidate makes
       * it in his own voice before the page turns to the reader with its ask.
       * See WatchBlock for the full position and state rationale.
       */}
      <PlaneCut from="surface" to="ink" />
      <Section id="watch" tone="ink">
        <WatchBlock
          /*
           * video is deliberately sourced from watchContentDefault, not
           * from watchContent (getWatchContent()'s CMS-merged result).
           * video is excluded from watchSchema, so SchemaForm never renders
           * a control for it, but SchemaForm's save path spreads the whole
           * loaded record forward on every edit, so a Watch content save
           * from /admin/content/watch could still persist a stray `video`
           * key into the oto_site_content row. Reading it from the
           * hardcoded default here keeps that scenario harmless: whatever
           * lands in the DB row is never read back out for rendering, and
           * "swap the value in content/watch.ts" stays the entire release
           * for this field regardless of what SchemaForm ever saves.
           */
          video={watchContentDefault.video}
          title={watchContent.title}
          answer={watchContent.answer}
          body={watchContent.body}
          coming={watchContent.coming}
        />
      </Section>
      <PlaneCut from="ink" to="green" />
      <Section id="get-involved" tone="green">
        <GetInvolvedBlock
          turnoutStats={getInvolvedContent.turnoutStats}
          turnoutBody={getInvolvedContent.turnoutBody}
          image={getInvolvedContent.image}
          asks={getInvolvedContent.asks}
        />
      </Section>
      <PlaneCut from="green" to="ink" />
      <Section tone="ink">
        <VoteTargets
          partyLogo={partyLogo}
          targetsLead={getInvolvedContent.targetsLead}
          targets={getInvolvedContent.targets}
          targetsSupport={getInvolvedContent.targetsSupport}
          epigraph={getInvolvedContent.epigraph}
        />
      </Section>
    </>
  );
}
