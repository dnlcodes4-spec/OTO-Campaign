import { Heading } from "@/components/primitives/Heading";
import { CampaignImage } from "@/components/primitives/CampaignImage";
import { agendaContent } from "@/content/agenda";

/*
 * The constituency pledges follow the legislative agenda as its close-to-home
 * half, back on the light plane so the eight short rows stay scannable. The
 * green display pull-line carries the document's own argument (planning over
 * money), the pledges run as a two-column ledger under heavy ink rules, and a
 * wide image slot closes the movement where a photograph of the district
 * will sit.
 */
export function PledgeGrid() {
  return (
    <div>
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-3xl"
      >
        And what is an honest senator <span className="text-brand-red">worth</span> at home?
      </Heading>
      <div className="mt-8 grid gap-x-12 gap-y-6 lg:mt-12 lg:grid-cols-12 lg:items-baseline">
        <p className="font-display text-2xl font-semibold leading-tight tracking-tight text-brand-green sm:text-3xl lg:col-span-6">
          {agendaContent.pledgesPull}
        </p>
        <p className="max-w-xl font-body text-base leading-relaxed text-ink/70 lg:col-span-6">
          {agendaContent.pledgesIntro}
        </p>
      </div>
      <div className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:mt-16">
        {agendaContent.pledges.map((pledge) => (
          <div key={pledge.title} className="border-t-2 border-ink py-6 sm:py-8">
            <Heading level={3} sizeOverride="text-xl sm:text-2xl leading-tight">
              {pledge.title}
            </Heading>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-ink/70">
              {pledge.detail}
            </p>
          </div>
        ))}
      </div>
      <CampaignImage
        alt={agendaContent.pledgesImageAlt}
        tone="green-deep"
        sizes="100vw"
        className="mt-4 aspect-[4/3] w-full sm:aspect-[21/9] lg:mt-8"
      />
    </div>
  );
}
