import { Heading } from "@/components/primitives/Heading";

type HeroProps = {
  headline: string;
  intro: string;
};

/*
 * The hero is a flat green poster plane. The headline anchors to the bottom
 * of the plane the way type sits on the campaign's printed material, and the
 * closing phrase carries the party gold. The intro paragraph hangs off the
 * right edge on desktop so the eye travels along the same diagonal the
 * section cut below it makes; on mobile it stacks flush left under the
 * headline at a tighter scale.
 */
export function Hero({ headline, intro }: HeroProps) {
  const words = headline.split(" ");
  const lead = words.slice(0, -2).join(" ");
  const emphasis = words.slice(-2).join(" ");

  return (
    <div className="flex min-h-[46svh] flex-col justify-end sm:min-h-[52svh] lg:min-h-[60svh]">
      <Heading level={1} className="max-w-4xl text-6xl sm:text-7xl lg:max-w-5xl lg:text-8xl">
        {lead ? (
          <>
            {lead} <span className="text-brand-gold">{emphasis}</span>
          </>
        ) : (
          headline
        )}
      </Heading>
      <p className="mt-8 max-w-md font-body text-base leading-relaxed text-ink-inverse/80 sm:text-lg lg:mt-12 lg:ml-auto lg:max-w-xl">
        {intro}
      </p>
    </div>
  );
}
