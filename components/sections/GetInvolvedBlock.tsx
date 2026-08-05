import { Heading } from "@/components/primitives/Heading";
import { CampaignImage } from "@/components/primitives/CampaignImage";
import { getInvolvedContent } from "@/content/get-involved";

/*
 * The last question on the page turns back on the reader. The turnout story
 * leads at display scale (four million registered, a third showing up), then
 * the four asks run as a numbered ledger, numbered because they escalate:
 * decide, persuade, volunteer, commit.
 *
 * The grey-suit cut-out grounds the ask. On desktop it holds the bottom left
 * while the ledger runs down the right, mirroring the hero where the
 * candidate holds the bottom right: the page opens and closes with him
 * breaking a diagonal cut. Like the other two portraits he rises out of a
 * diagonal-topped panel, here in the deep green of the incoming vote-targets
 * plane. The panel overruns the section by its bottom padding plus the strip
 * height (4+3rem, 5+4rem at sm, 7+6rem at lg), crossing the green-to-ink
 * diagonal and dissolving seamlessly into the plane below, so the candidate
 * stands on a tongue of the next plane rising through the cut. On mobile the
 * asks read first and the portrait closes the section the same way.
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
        <ol className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
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
        <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:justify-end">
          <div className="relative z-5 -mb-28 sm:-mb-36 lg:-mb-52">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-brand-green-deep [clip-path:polygon(0_30%,100%_12%,100%_100%,0_100%)]"
            />
            <CampaignImage
              src={getInvolvedContent.image.src}
              alt={getInvolvedContent.image.alt}
              fit="cutout"
              sizes="(min-width: 1152px) 412px, (min-width: 1024px) 40vw, 100vw"
              className="aspect-[1600/1235] w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
