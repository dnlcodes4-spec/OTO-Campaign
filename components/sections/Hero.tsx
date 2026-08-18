import Image from "next/image";
import { Heading } from "@/components/primitives/Heading";
import { CampaignImage } from "@/components/primitives/CampaignImage";

type HeroProps = {
  headline: string;
  intro: string;
  portrait: {
    src: string;
    alt: string;
  };
  /*
   * Hero is nested inside HomePage's returned tree rather than being the
   * component under direct test/render, so it stays a plain (non-async)
   * component and takes the party badge as a prop from the page, which
   * already awaits `getSiteContentData()` once for the whole route.
   */
  partyLogo: {
    src: string;
    alt: string;
  };
};

/*
 * The hero is a flat green poster plane with the candidate composed into it
 * the way the campaign's printed material would. The gold agbada portrait is
 * an alpha cut-out rising out of a deep-green panel whose top edge takes the
 * page's diagonal, high on the right like every cut on the site: the head
 * and cap break through the diagonal while the fabric fills the panel to
 * its edges, so the photograph's crop lines read as panel geometry, not as
 * a pasted rectangle. The same panel treatment repeats on the other two
 * portraits, which makes it the page's signature.
 *
 * The panel bleeds a short way past the plane's bottom edge, just enough to
 * break the diagonal cut strip below the way the badge breaks it above, but
 * not so far that the portrait itself gets swallowed behind the next plane.
 * Nearly all of the panel stays inside the hero's own frame (1.5rem at
 * base, 2rem at sm, 3rem at lg).
 *
 * Below lg the composition restructures instead of scaling: headline and
 * intro hold the full width with nothing beside them, then the portrait
 * takes its own right-aligned block under the text, leaving a rail of green
 * on the left, and runs into the cut the same way.
 *
 * The party badge sits on the portrait panel as a stamp breaking the
 * diagonal cut at the top right corner, the same way the candidate's head
 * and cap break it lower down: an endorsement stamped onto the poster
 * itself. It is the party's white card sitting directly on the green plane,
 * its own rounded edge and no added frame.
 *
 * The stamp's `lg:` position is a placeholder (top right corner, breaking
 * the cut) for the client to move; only those `lg:` classes are meant to
 * change; the base and `sm:` classes give it a settled default on mobile
 * and tablet, where the client will not be adjusting it by hand.
 */
export function Hero({ headline, intro, portrait, partyLogo }: HeroProps) {
  const words = headline.split(" ");
  const lead = words.slice(0, -2).join(" ");
  const emphasis = words.slice(-2).join(" ");

  return (
    <div className="relative grid gap-x-12 gap-y-10 lg:min-h-[76svh] lg:grid-cols-12 lg:items-end">
      <div className="relative z-10 flex min-h-[38svh] flex-col justify-end sm:min-h-[44svh] lg:col-span-7 lg:min-h-0">
        <Heading
          level={1}
          sizeOverride="text-6xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight"
        >
          {lead ? (
            <>
              {lead} <span className="text-brand-gold">{emphasis}</span>
            </>
          ) : (
            headline
          )}
        </Heading>
        <p className="mt-8 max-w-md font-body text-base leading-relaxed text-ink-inverse/80 sm:text-lg lg:mt-12 lg:max-w-lg">
          {intro}
        </p>
      </div>
      <div className="relative z-5 -mb-6 w-[82%] justify-self-end sm:-mb-8 sm:w-[68%] lg:absolute lg:-bottom-10 lg:right-0 lg:mb-0 lg:w-[44%]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-brand-green-deep [clip-path:polygon(0_22%,100%_8%,100%_100%,0_100%)]"
        />
        <CampaignImage
          src={portrait.src}
          alt={portrait.alt}
          fit="cutout"
          preload
          sizes="(min-width: 1152px) 465px, (min-width: 1024px) 44vw, 82vw"
          className="aspect-[1260/1600] w-full"
        />
        <Image
          src={partyLogo.src}
          alt={partyLogo.alt}
          width={186}
          height={160}
          className="absolute -top-4 right-3 z-20 h-auto w-20 sm:top-6 sm:right-5 sm:w-28 lg:-top-8 lg:right-6 lg:w-40"
        />
      </div>
    </div>
  );
}
