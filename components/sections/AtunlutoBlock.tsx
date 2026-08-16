import { Heading } from "@/components/primitives/Heading";
import { Button } from "@/components/primitives/Button";
import type { AtunlutoStat, ProgrammeGroup } from "@/content/atunluto";

/*
 * The third question in the about ledger, and the strongest pedigree
 * evidence on the page: "where is your structure?" is the question every
 * Nigerian race turns on, and the answer here is that he already built
 * one. The block keeps the section's established grammar: a hairline-free
 * heavy rule opens it like the pedigree divider above, the answer runs as
 * a red display line with the support copy beside it, and the proof sits
 * under three green display figures (founding year, membership, LGA
 * spread) whose scale echoes the turnout figures two planes down.
 *
 * The programme material is deliberately a dense listing, not cards: two
 * running interventions and a three-item cut of the Six Pillars as
 * hairline micro-rows, the agenda ledger's compact grammar translated to
 * the light plane. One outbound text link closes the block in the site's
 * border-and-arrow grammar, pointing at the group's own site.
 */
type AtunlutoBlockProps = {
  /*
   * AtunlutoBlock is nested inside HomePage's returned tree rather than
   * being the component under direct test/render (its own test renders
   * `<AtunlutoBlock />` directly, but a Promise-returning component can't
   * be resolved by React Testing Library that way), so it stays a plain
   * (non-async) component and takes its content as props from the page,
   * which awaits `getAtunlutoContent()` once for the route.
   */
  answer: string;
  caucusLine: string;
  model: string;
  stats: AtunlutoStat[];
  running: ProgrammeGroup;
  pillars: ProgrammeGroup;
  link: { href: string; label: string };
};

export function AtunlutoBlock({
  answer,
  caucusLine,
  model,
  stats,
  running,
  pillars,
  link,
}: AtunlutoBlockProps) {
  return (
    <div className="mt-16 border-t-2 border-ink pt-12 sm:mt-20 lg:mt-24 lg:pt-16">
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-3xl"
      >
        Where is your <span className="text-brand-green">structure</span>?
      </Heading>

      <div className="mt-8 grid gap-x-12 gap-y-6 lg:mt-12 lg:grid-cols-12 lg:items-baseline">
        <p className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-brand-red sm:text-4xl lg:col-span-5">
          {answer}
        </p>
        <div className="max-w-xl lg:col-span-7">
          <p className="font-body text-base leading-relaxed text-ink/70">
            {caucusLine}
          </p>
          <p className="mt-4 font-body text-base leading-relaxed text-ink/70">
            {model}
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-3 lg:mt-16">
        {stats.map((stat) => (
          <div key={stat.figure} className="border-t-2 border-ink pt-4">
            <p className="font-display text-4xl font-semibold leading-none tracking-tight text-brand-green sm:text-5xl">
              {stat.figure}
            </p>
            <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-ink/70">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Heading level={3} sizeOverride="text-xl sm:text-2xl leading-tight">
            {running.title}
          </Heading>
          <ul className="mt-3 divide-y divide-ink/10">
            {running.entries.map((entry) => (
              <li key={entry} className="py-2.5 font-body text-sm leading-relaxed text-ink/70">
                {entry}
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-7">
          <Heading level={3} sizeOverride="text-xl sm:text-2xl leading-tight">
            {pillars.title}
          </Heading>
          <ul className="mt-3 max-w-xl divide-y divide-ink/10">
            {pillars.entries.map((entry) => (
              <li key={entry} className="py-2.5 font-body text-sm leading-relaxed text-ink/70">
                {entry}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 lg:mt-12">
        <Button href={link.href} variant="text" tone="green" plane="light">
          {link.label}
        </Button>
      </div>
    </div>
  );
}
