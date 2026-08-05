import { Heading } from "@/components/primitives/Heading";
import { agendaContent, type AgendaItem } from "@/content/agenda";

/*
 * The legislative agenda is the meat of the page, so it gets the darkest
 * plane and the heaviest ledger. Each of the four items is a full-width row
 * under a hairline rule: an oversized gold numeral (the campaign's own docx
 * sets its sections with big numerals), the title at display scale, a thesis,
 * then the working detail as hairline micro-rows. The state police item
 * carries its two routes side by side under gold rules, because the two-route
 * strategy is the point.
 */
function AgendaItemRow({ item }: { item: AgendaItem }) {
  return (
    <article className="border-t border-ink-inverse/20 py-10 sm:py-12 lg:py-16">
      <div className="grid gap-x-10 gap-y-4 lg:grid-cols-12">
        <p className="font-display text-6xl font-semibold leading-none text-brand-gold sm:text-7xl lg:col-span-2 lg:text-8xl">
          {item.number}
        </p>
        <div className="lg:col-span-10">
          <Heading level={3} sizeOverride="text-3xl sm:text-4xl leading-[1.02] tracking-tight">
            {item.title}
          </Heading>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg">
            {item.thesis}
          </p>
          {item.routes && (
            <div className="mt-8 grid gap-8 sm:grid-cols-2 sm:gap-10">
              {item.routes.map((route) => (
                <div key={route.title} className="border-t-2 border-brand-gold pt-4">
                  <Heading level={4}>{route.title}</Heading>
                  <ul className="mt-3 divide-y divide-ink-inverse/10">
                    {route.points.map((point) => (
                      <li
                        key={point}
                        className="py-2.5 font-body text-sm leading-relaxed text-ink-inverse/70"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {item.points && (
            <ul className="mt-6 max-w-4xl divide-y divide-ink-inverse/10 sm:columns-2 sm:gap-10 sm:[column-fill:balance]">
              {item.points.map((point) => (
                <li
                  key={point}
                  className="break-inside-avoid py-2.5 font-body text-sm leading-relaxed text-ink-inverse/70"
                >
                  {point}
                </li>
              ))}
            </ul>
          )}
          {item.note && (
            <p className="mt-6 max-w-2xl font-body text-sm leading-relaxed text-ink-inverse/50">
              {item.note}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function AgendaLedger() {
  return (
    <div>
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-4xl"
      >
        When you get there, what do you have in mind <span className="text-brand-gold">for us?</span>
      </Heading>
      <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg lg:mt-12">
        {agendaContent.intro}
      </p>
      <div className="mt-12 lg:mt-16">
        {agendaContent.items.map((item) => (
          <AgendaItemRow key={item.number} item={item} />
        ))}
      </div>
    </div>
  );
}
