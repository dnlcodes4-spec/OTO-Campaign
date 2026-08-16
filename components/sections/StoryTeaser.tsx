import Link from "next/link";
import { Heading } from "@/components/primitives/Heading";

/*
 * The middle block of the about plane: pedigree answers whether he can do
 * it, this answers who he is, Atunluto answers where his structure is. Three
 * condensed paragraphs in balanced columns, then the handoff to /story where
 * the full narrative lives. The link keeps the light-plane focus ring the
 * nav establishes for this background.
 */
type StoryTeaserProps = {
  /*
   * StoryTeaser is nested inside HomePage's returned tree rather than being
   * the component under direct test/render (its own test renders
   * `<StoryTeaser />` directly, but a Promise-returning component can't be
   * resolved by React Testing Library that way), so it stays a plain
   * (non-async) component and takes its content as props from the page,
   * which awaits `getStoryContent()` once for the route.
   */
  paragraphs: string[];
  cta: string;
  href: string;
};

export function StoryTeaser({ paragraphs, cta, href }: StoryTeaserProps) {
  return (
    <div className="mt-16 border-t-2 border-ink pt-12 sm:mt-20 lg:mt-24 lg:pt-16">
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-3xl"
      >
        But <span className="text-brand-red">who</span> is OTO?
      </Heading>
      <div className="mt-8 max-w-4xl font-body text-base leading-relaxed text-ink/70 sm:columns-2 sm:gap-12 lg:mt-12">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="break-inside-avoid pb-5">
            {paragraph}
          </p>
        ))}
      </div>
      <Link
        href={href}
        className="mt-6 inline-block font-display text-xl font-semibold text-brand-green underline decoration-2 underline-offset-4 hover:text-brand-green-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:text-2xl"
      >
        {cta}
      </Link>
    </div>
  );
}
