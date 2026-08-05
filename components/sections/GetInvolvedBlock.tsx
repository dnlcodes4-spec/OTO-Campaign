import { Heading } from "@/components/primitives/Heading";
import { CampaignImage } from "@/components/primitives/CampaignImage";
import { getInvolvedContent } from "@/content/get-involved";

/*
 * The last question on the page turns back on the reader. The four asks run
 * as a numbered ledger down the right, numbered because they escalate:
 * decide, persuade, volunteer, commit.
 *
 * The left column is one composed unit: a deep-green panel that spans the
 * full column height, its top edge taking the page's diagonal, high on the
 * right so its top corner meets the ledger's first rule across the gutter.
 * The turnout story lives inside the panel, where the void used to be: the
 * two figures at poster scale in gold, echoing the vote-target numerals on
 * the plane below, their labels and the supporting paragraph in body type.
 * The grey-suit cut-out anchors to the panel base at full panel width.
 *
 * The panel is the deep green of the incoming vote-targets plane and
 * overruns the section by its bottom padding plus the cut-strip height
 * (4+3rem, 5+4rem at sm, 7+6rem at lg), so it crosses the green-to-ink
 * diagonal and dissolves into the plane below: the candidate stands on a
 * tongue of the next plane rising through the cut, mirroring the hero at
 * bottom right. On mobile the asks read first and the panel closes the
 * section the same way.
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
      <div className="mt-10 grid gap-x-12 gap-y-14 lg:mt-14 lg:grid-cols-12">
        <ol className="lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:flex lg:flex-col lg:justify-between">
          {getInvolvedContent.asks.map((ask) => (
            <li
              key={ask.number}
              className="grid grid-cols-[auto_1fr] gap-x-6 border-t border-ink-inverse/20 py-6 sm:py-8 lg:gap-x-8 lg:py-10"
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
        <div className="relative z-5 -mb-28 flex flex-col sm:-mb-36 lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:-mb-52">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-brand-green-deep [clip-path:polygon(0_2.5rem,100%_0,100%_100%,0_100%)] sm:[clip-path:polygon(0_3rem,100%_0,100%_100%,0_100%)] lg:[clip-path:polygon(0_2rem,100%_0,100%_100%,0_100%)]"
          />
          <div className="relative px-6 pb-10 pt-16 sm:px-8 sm:pt-20 lg:pt-16">
            <div className="flex flex-col gap-8">
              {getInvolvedContent.turnoutStats.map((stat) => (
                <div key={stat.figure}>
                  <p className="font-display text-5xl font-semibold leading-none tracking-tight text-brand-gold sm:text-6xl lg:text-7xl">
                    {stat.figure}
                  </p>
                  <p className="mt-3 font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 border-t border-ink-inverse/20 pt-6 font-body text-base leading-relaxed text-ink-inverse/75">
              {getInvolvedContent.turnoutBody}
            </p>
          </div>
          <CampaignImage
            src={getInvolvedContent.image.src}
            alt={getInvolvedContent.image.alt}
            fit="cutout"
            sizes="(min-width: 1152px) 504px, (min-width: 1024px) 48vw, 100vw"
            className="relative mt-auto aspect-[1600/1235] w-full"
          />
        </div>
      </div>
    </div>
  );
}
