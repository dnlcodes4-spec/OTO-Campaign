import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/primitives/Section";
import { Heading } from "@/components/primitives/Heading";
import { getStoryContent } from "@/content/story";

export const metadata: Metadata = {
  title: "The OTO Story",
  description:
    "Who Oluwasegun Theophilus Oladimeji is: the Eruwa childhood, the calling, and the road to the Zenith Labour Party ticket.",
};

/*
 * The long-form answer to the about plane's teaser. Two planes only: a green
 * title plane asking the question at poster scale, then the narrative on the
 * light plane as a single measured column, each chapter opening on a heavy
 * ink rule the way the landing page's ledgers do. The page closes by handing
 * the reader back to the agenda, because the story is the warrant for the
 * agenda, not a destination of its own.
 */
export default async function StoryPage() {
  const { page } = await getStoryContent();
  return (
    <>
      <Section tone="green">
        <Heading
          level={1}
          sizeOverride="text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight"
          className="max-w-3xl text-ink-inverse"
        >
          But <span className="text-brand-gold">who</span> is OTO?
        </Heading>
        <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-ink-inverse/80 sm:text-lg">
          {page.lead}
        </p>
      </Section>
      <Section>
        <div className="mx-auto max-w-3xl">
          {page.sections.map((section) => (
            <article key={section.heading} className="border-t-2 border-ink py-10 first:border-t-0 first:pt-0 sm:py-12">
              <Heading level={2} sizeOverride="text-3xl sm:text-4xl leading-[1.02] tracking-tight">
                {section.heading}
              </Heading>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-5 font-body text-base leading-relaxed text-ink/75 sm:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
          <div className="border-t-2 border-ink pt-10 sm:pt-12">
            <p className="font-display text-2xl font-semibold leading-tight tracking-tight text-brand-green sm:text-3xl">
              {page.closing.line}
            </p>
            <Link
              href={page.closing.href}
              className="mt-6 inline-block font-display text-xl font-semibold text-brand-red underline decoration-2 underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:text-2xl"
            >
              {page.closing.cta}
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
