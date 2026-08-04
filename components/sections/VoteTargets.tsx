import { getInvolvedContent } from "@/content/get-involved";

/*
 * The page ends the way the campaign document does: with the count. Two
 * poster-scale gold figures on the deep green plane that runs on into the
 * footer, the second stepped to the right so the eye descends the same
 * diagonal the section cuts draw. Under them, the campaign line, the verse
 * the whole campaign takes its name from, closes the page quietly.
 */
export function VoteTargets() {
  return (
    <div>
      <p className="max-w-2xl font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg">
        {getInvolvedContent.targetsLead}
      </p>
      <div className="mt-10 flex flex-col gap-10 lg:mt-14 lg:gap-14">
        {getInvolvedContent.targets.map((target, index) => (
          <div
            key={target.figure}
            className={`border-t border-ink-inverse/20 pt-6 lg:w-4/5 ${
              index % 2 === 1 ? "lg:ml-auto lg:text-right" : ""
            }`}
          >
            <p className="font-display text-6xl font-semibold leading-none tracking-tight text-brand-gold sm:text-7xl lg:text-9xl">
              {target.figure}
            </p>
            <p
              className={`mt-3 max-w-xl font-body text-base leading-relaxed text-ink-inverse/75 sm:text-lg ${
                index % 2 === 1 ? "lg:ml-auto" : ""
              }`}
            >
              {target.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-16 max-w-3xl font-display text-xl font-medium leading-snug text-ink-inverse/60 sm:text-2xl lg:mt-24">
        &ldquo;{getInvolvedContent.epigraph}&rdquo;
      </p>
    </div>
  );
}
