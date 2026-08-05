import { Heading } from "@/components/primitives/Heading";
import { CampaignImage } from "@/components/primitives/CampaignImage";
import { getInvolvedContent } from "@/content/get-involved";

/*
 * The last question on the page turns back on the reader. The turnout story
 * leads at display scale (four million registered, a third showing up), then
 * the four asks run as a numbered ledger, numbered because they escalate:
 * decide, persuade, volunteer, commit. The portrait slot rides the right
 * column beside the asks on desktop and closes the section on mobile, the
 * candidate alongside the ask itself.
 */
export function GetInvolvedBlock() {
  return (
    <div>
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-3xl"
      >
        What do we expect <span className="text-brand-gold">from you?</span>
      </Heading>
      <div className="mt-8 grid gap-x-12 gap-y-6 lg:mt-12 lg:grid-cols-12">
        <p className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:col-span-5">
          {getInvolvedContent.turnoutLead}
        </p>
        <p className="max-w-2xl font-body text-base leading-relaxed text-ink-inverse/75 lg:col-span-7">
          {getInvolvedContent.turnoutBody}
        </p>
      </div>
      <div className="mt-12 grid gap-x-12 gap-y-10 lg:mt-16 lg:grid-cols-12">
        <ol className="lg:col-span-7">
          {getInvolvedContent.asks.map((ask) => (
            <li
              key={ask.number}
              className="grid grid-cols-[auto_1fr] gap-x-6 border-t border-ink-inverse/20 py-6 sm:py-8 lg:gap-x-8"
            >
              <p className="font-display text-3xl font-semibold leading-none text-brand-gold sm:text-4xl">
                {ask.number}
              </p>
              <div>
                <Heading level={3} sizeOverride="text-2xl sm:text-3xl leading-tight">
                  {ask.title}
                </Heading>
                <p className="mt-2 max-w-xl font-body text-base leading-relaxed text-ink-inverse/75">
                  {ask.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="lg:col-span-5">
          <CampaignImage
            alt={getInvolvedContent.imageAlt}
            tone="green-deep"
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-auto lg:h-full"
          />
        </div>
      </div>
    </div>
  );
}
