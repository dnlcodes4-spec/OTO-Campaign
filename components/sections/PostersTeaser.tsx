import Link from "next/link";
import { Heading } from "@/components/primitives/Heading";

/*
 * Closes the get-involved plane by turning the "be financially committed"
 * ask into something everyone can do today, no wallet required: carry the
 * campaign's own posters. Sits on the same dark green plane as
 * GetInvolvedBlock above it, so it borrows that block's dark-plane tokens
 * (ink-inverse text, gold accents) rather than StoryTeaser's light-plane ones.
 */
export function PostersTeaser() {
  return (
    <div className="mt-16 border-t border-ink-inverse/20 pt-12 sm:mt-20 lg:mt-24 lg:pt-16">
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-3xl"
      >
        Five posters, <span className="text-brand-gold">yours to spread</span>
      </Heading>
      <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-ink-inverse/75">
        Download the campaign&apos;s poster designs, set one as your status, print copies for
        your own corner of Oyo South, and hand them out.
      </p>
      <Link
        href="/work-with-us"
        className="mt-6 inline-block font-display text-xl font-semibold text-brand-gold underline decoration-2 underline-offset-4 hover:text-ink-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold sm:text-2xl"
      >
        Get the posters
      </Link>
    </div>
  );
}
