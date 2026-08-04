import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { Hero } from "@/components/sections/Hero";
import { TeaserCard } from "@/components/sections/TeaserCard";
import { CTABand } from "@/components/sections/CTABand";
import { homeContent } from "@/content/home";

export const metadata: Metadata = {
  title: "OTO for Senate | Oyo South Senatorial District",
  description:
    "Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.",
};

/*
 * Three flat planes: green, surface, deep green. They meet on parallel
 * diagonal cuts, the same device the campaign's printed material uses, so
 * the page reads as one poster rather than a stack of sections.
 */
export default function HomePage() {
  return (
    <>
      <Section tone="green">
        <Hero headline={homeContent.headline} intro={homeContent.intro} />
      </Section>
      <div
        aria-hidden="true"
        className="-mt-px h-12 w-full bg-brand-green [clip-path:polygon(0_0,100%_0,0_100%)] sm:h-16 lg:h-24"
      />
      <Section>
        <div className="border-b-2 border-ink">
          {homeContent.teasers.map((teaser) => (
            <TeaserCard key={teaser.href} {...teaser} />
          ))}
        </div>
      </Section>
      <div
        aria-hidden="true"
        className="-mb-px h-12 w-full bg-brand-green-deep [clip-path:polygon(100%_0,100%_100%,0_100%)] sm:h-16 lg:h-24"
      />
      <Section tone="ink">
        <CTABand {...homeContent.closing} />
      </Section>
    </>
  );
}
