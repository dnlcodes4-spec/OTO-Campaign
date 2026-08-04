import { Heading } from "@/components/primitives/Heading";
import { Button } from "@/components/primitives/Button";

type TeaserCardProps = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

/*
 * Each teaser is a full-width ledger row under a heavy ink rule, not a card.
 * On desktop the row reads left to right: a large display title, the body a
 * column over, and the red link parked against the right edge. On mobile the
 * same row stacks flush left. The rules and the type do all the work; there
 * is no box.
 */
export function TeaserCard({ title, body, href, linkLabel }: TeaserCardProps) {
  return (
    <div className="grid gap-y-4 border-t-2 border-ink py-8 sm:py-10 lg:grid-cols-12 lg:items-baseline lg:gap-x-10 lg:py-14">
      <Heading level={2} className="lg:col-span-5">
        {title}
      </Heading>
      <p className="max-w-xl font-body text-base leading-relaxed text-ink/70 lg:col-span-4">
        {body}
      </p>
      <Button
        href={href}
        tone="red"
        variant="text"
        className="justify-self-start hover:border-brand-red-pressed hover:text-brand-red-pressed lg:col-span-3 lg:justify-self-end"
      >
        {linkLabel}
      </Button>
    </div>
  );
}
