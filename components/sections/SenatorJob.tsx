import { Heading } from "@/components/primitives/Heading";
import { senatorJobContent } from "@/content/senator-job";

/*
 * The job description follows the worth question as the second block of the
 * pledges plane: after what an honest senator is worth at home, what the job
 * actually is. Four numbered rows under the same heavy ink rules the pledges
 * use, numerals in red because this block indicts the incumbents, and the
 * brief's standing challenge closes it as a green display pull-line, the
 * mirror of the pledges' own opening pull.
 */
export function SenatorJob() {
  return (
    <div className="mt-16 border-t-2 border-ink pt-12 sm:mt-20 lg:mt-24 lg:pt-16">
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-3xl"
      >
        So what does a senator actually <span className="text-brand-red">do</span> all day?
      </Heading>
      <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-ink/70 sm:text-lg lg:mt-12">
        {senatorJobContent.intro}
      </p>
      <ol className="mt-10 lg:mt-14">
        {senatorJobContent.segments.map((segment) => (
          <li
            key={segment.number}
            className="grid grid-cols-[auto_1fr] gap-x-6 border-t-2 border-ink py-6 sm:py-8 lg:gap-x-10"
          >
            <p className="font-display text-3xl font-semibold leading-none text-brand-red sm:text-4xl">
              {segment.number}
            </p>
            <div>
              <Heading level={3} sizeOverride="text-2xl sm:text-3xl leading-tight">
                {segment.title}
              </Heading>
              <p className="mt-2 max-w-3xl font-body text-base leading-relaxed text-ink/70">
                {segment.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-10 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-tight text-brand-green sm:text-3xl">
        {senatorJobContent.challenge}
      </p>
    </div>
  );
}
