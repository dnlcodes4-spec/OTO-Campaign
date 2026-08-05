import { Container } from "@/components/primitives/Container";
import { Heading } from "@/components/primitives/Heading";
import { CampaignImage } from "@/components/primitives/CampaignImage";
import { getInvolvedContent } from "@/content/get-involved";

/*
 * The page's climax is one full-bleed deep-green poster plane, so this block
 * owns its own section element instead of taking the Section primitive: the
 * vote-target numerals need the whole viewport width to crop off the plane
 * edges the way poster type does, and the old separate vote-targets plane is
 * subsumed here so the count lands where the asking happens.
 *
 * Reading order is the argument. The heading turns the page's question on
 * the reader, a quiet intro row states the turnout math and the BVAS case,
 * then the poster field answers with the commitment: the two numerals at
 * architectural scale in gold, the first bleeding off the left edge, the
 * second off the right, their labels small beneath them inside the measure.
 * The four asks run as a compact numbered strip in the right column, tight
 * and scannable under the count they serve, and the Nehemiah epigraph closes
 * beneath the strip. The grey-suit cut-out stands large across the bottom
 * left, in front of the type like a poster subject, mirroring the hero's
 * bottom right so the page opens and closes with the candidate. The plane
 * runs seamlessly into the same-color footer, so his crop line lands on the
 * page's last seam.
 *
 * Below lg the poster recomposes instead of scaling: numerals stack at
 * viewport scale, the strip and epigraph follow at full width, and the
 * portrait anchors the plane's base flush into the footer.
 */
export function GetInvolvedBlock() {
  return (
    <section
      id="get-involved"
      className="relative -mb-px scroll-mt-16 overflow-hidden bg-brand-green-deep pt-16 text-ink-inverse sm:pt-20 lg:pt-28"
    >
      <Container>
        <Heading
          level={2}
          sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
          className="max-w-3xl"
        >
          What do we expect <span className="text-brand-gold">from you?</span>
        </Heading>
        <div className="mt-8 grid gap-x-12 gap-y-8 lg:mt-12 lg:grid-cols-12">
          <div className="flex flex-col gap-3 lg:col-span-5">
            {getInvolvedContent.turnoutStats.map((stat) => (
              <p
                key={stat.figure}
                className="font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg"
              >
                <span className="font-display text-2xl font-semibold tracking-tight text-brand-gold sm:text-3xl">
                  {stat.figure}
                </span>{" "}
                <span>{stat.label}</span>
              </p>
            ))}
          </div>
          <p className="font-body text-base leading-relaxed text-ink-inverse/75 lg:col-span-7">
            {getInvolvedContent.turnoutBody}
          </p>
        </div>
      </Container>
      <div className="relative mt-14 sm:mt-16 lg:mt-24">
        <Container>
          <p className="max-w-2xl font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg">
            {getInvolvedContent.targetsLead}
          </p>
        </Container>
        <div className="mt-6 lg:mt-8">
          <p className="-ml-[2vw] whitespace-nowrap font-display text-[23vw] font-semibold leading-[0.82] tracking-tight text-brand-gold lg:-ml-[1vw] lg:text-[17vw]">
            {getInvolvedContent.targets[0].figure}
          </p>
          <Container>
            <p className="mt-2 max-w-md font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg">
              {getInvolvedContent.targets[0].label}
            </p>
          </Container>
          <p className="-mr-[4vw] mt-10 whitespace-nowrap text-right font-display text-[23vw] font-semibold leading-[0.82] tracking-tight text-brand-gold sm:mt-12 lg:-mr-[2vw] lg:-mt-[3vw] lg:text-[17vw]">
            {getInvolvedContent.targets[1].figure}
          </p>
          <Container>
            <p className="ml-auto mt-2 max-w-md text-right font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg">
              {getInvolvedContent.targets[1].label}
            </p>
          </Container>
        </div>
        <Container className="relative z-10 mt-12 lg:mt-10 lg:pb-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
            <ol className="border-b border-ink-inverse/20 lg:col-span-6 lg:col-start-7">
              {getInvolvedContent.asks.map((ask) => (
                <li
                  key={ask.number}
                  className="grid grid-cols-[auto_1fr] gap-x-4 border-t border-ink-inverse/20 py-4 sm:gap-x-5 sm:py-5"
                >
                  <p className="font-display text-lg font-semibold leading-tight text-brand-gold sm:text-xl">
                    {ask.number}
                  </p>
                  <div>
                    <Heading level={3} sizeOverride="text-lg sm:text-xl leading-tight">
                      {ask.title}
                    </Heading>
                    <p className="mt-1 font-body text-sm leading-relaxed text-ink-inverse/70 sm:text-base">
                      {ask.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-10 font-display text-lg font-medium leading-snug text-ink-inverse/60 sm:text-xl lg:col-span-6 lg:col-start-7 lg:mt-12 lg:text-2xl">
              &ldquo;{getInvolvedContent.epigraph}&rdquo;
            </p>
          </div>
        </Container>
        <CampaignImage
          src={getInvolvedContent.image.src}
          alt={getInvolvedContent.image.alt}
          fit="cutout"
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="relative z-10 mt-12 aspect-[1600/1235] w-full lg:absolute lg:bottom-0 lg:left-[-4vw] lg:mt-0 lg:w-[62vw]"
        />
      </div>
    </section>
  );
}
