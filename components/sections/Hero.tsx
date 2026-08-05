import { Heading } from "@/components/primitives/Heading";
import { CampaignImage } from "@/components/primitives/CampaignImage";

type HeroProps = {
  headline: string;
  intro: string;
  portraitAlt: string;
};

/*
 * The hero is a flat green poster plane. The headline anchors to the bottom
 * of the plane the way type sits on the campaign's printed material, with the
 * closing phrase carrying the party gold, and the candidate's portrait slot
 * holds the right edge as a deep green plane until the photograph arrives.
 * Its top edge takes the same diagonal the section cuts use, so the portrait
 * belongs to the poster rather than sitting on it. On mobile the composition
 * stacks: headline, intro, then the portrait running into the cut below.
 */
export function Hero({ headline, intro, portraitAlt }: HeroProps) {
  const words = headline.split(" ");
  const lead = words.slice(0, -2).join(" ");
  const emphasis = words.slice(-2).join(" ");

  return (
    <div className="grid gap-x-12 gap-y-12 lg:min-h-[68svh] lg:grid-cols-12 lg:items-end">
      <div className="flex min-h-[38svh] flex-col justify-end sm:min-h-[44svh] lg:col-span-7 lg:min-h-0">
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
      <div className="lg:col-span-5">
        <CampaignImage
          alt={portraitAlt}
          tone="green-deep"
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="aspect-[4/5] w-full [clip-path:polygon(0_5%,100%_0,100%_100%,0_100%)] sm:aspect-[16/10] lg:aspect-[4/5]"
        />
      </div>
    </div>
  );
}
