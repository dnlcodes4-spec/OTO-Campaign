import { Heading } from "@/components/primitives/Heading";
import { Button } from "@/components/primitives/Button";

type CTABandProps = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

/*
 * The closing statement. Set on the deep green plane that runs on into the
 * footer, so the page ends on one dark, settled block. The title's last word
 * takes the gold, echoing the hero, and the ask sits under a hairline rule
 * with the gold button holding the right edge. On mobile the button goes
 * full width so the last thing under a thumb is the ask itself.
 */
export function CTABand({ title, body, href, linkLabel }: CTABandProps) {
  const words = title.split(" ");
  const lead = words.slice(0, -1).join(" ");
  const emphasis = words.slice(-1).join(" ");

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <Heading level={2} className="max-w-3xl">
        {lead ? (
          <>
            {lead} <span className="text-brand-gold">{emphasis}</span>
          </>
        ) : (
          title
        )}
      </Heading>
      <div className="flex flex-col gap-8 border-t border-ink-inverse/15 pt-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
        <p className="max-w-xl font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg">
          {body}
        </p>
        <Button
          href={href}
          tone="gold"
          variant="solid"
          className="w-full justify-center sm:w-auto sm:shrink-0"
        >
          {linkLabel}
        </Button>
      </div>
    </div>
  );
}
