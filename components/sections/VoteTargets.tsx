import Image from "next/image";
import type { VoteTarget } from "@/content/get-involved";

/*
 * The page ends the way the campaign document does: with the count. The
 * revised brief asks for one number only, a million votes at Oyo South, so
 * a single poster-scale gold figure holds the deep green plane that runs on
 * into the footer, with the brief's own resolve line under it. Then the
 * campaign line, the verse the whole campaign takes its name from, closes
 * the page quietly.
 *
 * The count is votes for the Zenith Labour Party, so the party badge heads
 * the plane at its largest size on the site, the letterhead over the
 * ledger. On lg it sits opposite the lead line, top right against the
 * numeral's left edge below. Below lg it takes the top of the plane alone,
 * right aligned on the same edge, before the lead line and the count. The
 * white card sits directly on the deep green plane with its own rounded
 * edge, the identical treatment the badge gets in the hero and footer.
 */
type VoteTargetsProps = {
  /*
   * VoteTargets is nested inside HomePage's returned tree rather than being
   * the component under direct test/render, so it stays a plain
   * (non-async) component and takes the party badge as a prop from the
   * page, which already awaits `getSiteContentData()` once for the route.
   */
  partyLogo: {
    src: string;
    alt: string;
  };
  targetsLead: string;
  targets: VoteTarget[];
  targetsSupport: string;
  epigraph: string;
};

export function VoteTargets({ partyLogo, targetsLead, targets, targetsSupport, epigraph }: VoteTargetsProps) {
  return (
    <div>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <Image
          src={partyLogo.src}
          alt={partyLogo.alt}
          width={186}
          height={160}
          className="order-1 h-auto w-28 self-end sm:w-36 lg:order-2 lg:w-44 lg:shrink-0 lg:self-auto"
        />
        <p className="order-2 max-w-2xl font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg lg:order-1">
          {targetsLead}
        </p>
      </div>
      <div className="mt-10 flex flex-col gap-10 lg:mt-14 lg:gap-14">
        {targets.map((target) => (
          <div key={target.figure} className="border-t border-ink-inverse/20 pt-6 lg:w-4/5">
            <p className="font-display text-6xl font-semibold leading-none tracking-tight text-brand-gold sm:text-7xl lg:text-9xl">
              {target.figure}
            </p>
            <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg">
              {target.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-ink-inverse/60">
        {targetsSupport}
      </p>
      <p className="mt-16 max-w-3xl font-display text-xl font-medium leading-snug text-ink-inverse/60 sm:text-2xl lg:mt-24">
        &ldquo;{epigraph}&rdquo;
      </p>
    </div>
  );
}
