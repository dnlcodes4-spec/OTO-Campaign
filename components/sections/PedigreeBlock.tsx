import { Heading } from "@/components/primitives/Heading";
import { CampaignImage } from "@/components/primitives/CampaignImage";
import { aboutContent } from "@/content/about";

/*
 * The about section keeps the campaign's own structure: the questions a
 * district should be asking anyone who wants its seat. Two of them live here.
 * The first gets a one-line answer set at display scale; the second gets the
 * full ledger: the name with its three initials picked out in green (that is
 * where OTO comes from), the character copy beside the portrait, the
 * education rows, and the candidate's answer-quote on a flat red plane, the
 * only red plane on the page.
 *
 * The portrait is an alpha cut-out composed against its own green plane. The
 * plane's top edge takes the page's diagonal, high on the right like every
 * cut on the site, and the head breaks through it while the shoulders crop
 * flush with the plane's bottom edge. On desktop the whole composition
 * bottom-anchors so its base lines up with the red quote plane across the
 * gutter: green and red closing on the same baseline.
 */
export function PedigreeBlock() {
  const { nameParts, portrait } = aboutContent;

  return (
    <div>
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-3xl"
      >
        Why should we send you to Abuja?
      </Heading>
      <div className="mt-8 grid gap-x-12 gap-y-6 lg:mt-12 lg:grid-cols-12 lg:items-baseline">
        <p className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-brand-red sm:text-4xl lg:col-span-5">
          {aboutContent.abujaAnswer}
        </p>
        <p className="max-w-xl font-body text-base leading-relaxed text-ink/70 lg:col-span-7">
          {aboutContent.abujaSupport}
        </p>
      </div>

      <div className="mt-16 border-t-2 border-ink pt-12 sm:mt-20 lg:mt-24 lg:pt-16">
        <Heading
          level={2}
          sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
          className="max-w-3xl"
        >
          What <span className="text-brand-red">pedigree</span> do you have?
        </Heading>

        <div className="mt-10 grid gap-x-12 gap-y-10 lg:mt-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-display text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              {nameParts.map((part, index) => (
                <span key={part}>
                  <span className="text-brand-green">{part[0]}</span>
                  {part.slice(1)}
                  {index < nameParts.length - 1 ? " " : "."}
                </span>
              ))}
            </p>
            <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-ink/60">
              {aboutContent.nameNote}
            </p>
            <p className="mt-8 max-w-xl font-body text-base leading-relaxed text-ink/70 sm:text-lg">
              {aboutContent.character}
            </p>
            <blockquote className="mt-10 bg-brand-red p-8 [clip-path:polygon(0_0,100%_0,100%_92%,94%_100%,0_100%)] sm:p-10 lg:mt-12">
              <p className="font-display text-2xl font-semibold leading-tight text-ink-inverse sm:text-3xl">
                {aboutContent.quote}
              </p>
            </blockquote>
          </div>
          <div className="lg:col-span-5 lg:flex lg:h-full lg:flex-col lg:justify-end">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-brand-green [clip-path:polygon(0_30%,100%_12%,100%_100%,0_100%)]"
              />
              <CampaignImage
                src={portrait.src}
                alt={portrait.alt}
                fit="cutout"
                sizes="(min-width: 1152px) 412px, (min-width: 1024px) 40vw, 100vw"
                className="aspect-[1453/1600] w-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-14 lg:mt-20">
          {aboutContent.education.map((entry) => (
            <div
              key={entry.school}
              className="grid gap-y-1 border-t-2 border-ink py-6 sm:py-8 lg:grid-cols-12 lg:items-baseline lg:gap-x-10"
            >
              <p className="font-display text-xl font-medium text-ink/60 lg:col-span-2">
                {entry.period}
              </p>
              <Heading level={3} className="lg:col-span-6">
                {entry.school}
              </Heading>
              <p className="font-body text-base leading-relaxed text-ink/70 lg:col-span-4 lg:text-right">
                {entry.credential}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
