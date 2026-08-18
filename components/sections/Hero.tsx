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
 * The whole panel deliberately overruns the plane: it extends through the
 * section's bottom padding and the full height of the diagonal cut strip
 * below, so the candidate breaks the diagonal and the panel's base lands
 * exactly where the next plane takes over. The numbers are load-bearing:
 * the hang is section bottom padding plus strip height (4+3rem, then
 * 5+4rem at sm, then 7+6rem at lg).
 *
 * Below lg the composition restructures instead of scaling: headline and
 * intro hold the full width with nothing beside them, then the portrait
 * takes its own right-aligned block under the text, leaving a rail of green
 * on the left, and runs into the cut the same way.
 *
 * The party badge appears twice, each reading differently. At the lower
 * left of the headline column it closes the text stack the way a printed
 * poster signs off, seal-scale, flush with the text edge, preloaded because
 * that placement is inside the first viewport. On the portrait panel it is
 * a second, larger mark: the endorsement stamped onto the poster itself,
 * free to sit anywhere on the panel rather than one fixed corner. Both are
 * the party's white card sitting directly on the green plane, their own
 * rounded edge and no added frame.
 *
 * The portrait-panel badge's positioning parent is the outer right-hand
 * box, not the portrait image's own (bled, overrun) box: at lg that outer
 * box spans the full height of the hero (`lg:inset-y-0`), so the badge can
 * be anchored anywhere across the whole right-hand side, not just within
 * the portrait's own bounds. The portrait image sits in an inner box that
 * carries the bleed instead. The badge is positioned with all four inset
 * sides (top, right, bottom, left) rather than just two, so it can be moved
 * to any corner or edge by changing which sides carry a value, not only
 * slid along one fixed pair. Only its `lg:` classes are a placeholder for
 * the client to move; the base and `sm:` classes give it a settled default
 * on mobile and tablet, where the outer box is not full-height (there is no
 * separate "right-hand side" below lg) and the client will not be adjusting
 * it by hand.
 */
export function Hero({ headline, intro, portrait, partyLogo }: HeroProps) {
  const words = headline.split(" ");
  const lead = words.slice(0, -2).join(" ");
  const emphasis = words.slice(-2).join(" ");

  return (
    <div className="relative grid gap-x-12 gap-y-10 lg:min-h-[68svh] lg:grid-cols-12 lg:items-end">
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
      <div className="relative z-5 -mb-28 w-[82%] justify-self-end sm:-mb-36 sm:w-[68%] lg:absolute lg:inset-y-0 lg:right-0 lg:mb-0 lg:w-[44%]">
        <div className="relative lg:absolute lg:-bottom-52 lg:left-0 lg:w-full">
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
        </div>
        <Image
          src={partyLogo.src}
          alt={partyLogo.alt}
          width={186}
          height={160}
          className="absolute top-5 right-0.5 z-20 h-auto w-20 sm:top-6 sm:right-3 sm:w-28 lg:top-8 lg:right-6 lg:w-40"
        />
      </div>
    </div>
  );
}
