import { Heading } from "@/components/primitives/Heading";
import { VideoFacade } from "./VideoFacade";
import { VideoFacadeDirect } from "./VideoFacadeDirect";
import { watchContent } from "@/content/watch";

/*
 * The film plane sits between the pledges and the ask on purpose: by this
 * point the page has made its whole written case (pedigree, structure,
 * agenda, worth at home), and the next plane asks the reader to commit.
 * The film is the last piece of evidence before that ask, the candidate
 * making the case in his own voice, so it lands as the closing argument,
 * not an opener. It takes the deep green plane because the site's ink tone
 * is also its cinema: poster type and gold accents read strongest there,
 * and a 16:9 frame belongs on a dark plane.
 *
 * Three states, all designed, keyed off content/watch.ts's video field:
 *
 * 1. video null: the held plane below, a brand-green 16:9 field rising
 *    through the section's deep green on the page's diagonal, carrying the
 *    promise in poster type over a gold rule. Nothing pretends to be
 *    clickable; the plane is the composition, not an empty player.
 * 2. video.type "youtube": VideoFacade renders the thumbnail facade with a
 *    real play control, and no YouTube JavaScript loads until it is
 *    pressed.
 * 3. video.type "direct": VideoFacadeDirect renders the same facade
 *    grammar against a self-hosted (Cloudinary) clip; play swaps it for an
 *    inline, autoplaying <video> rather than an iframe embed.
 *
 * Swapping the value in content/watch.ts is the entire release; this
 * component does not change.
 */
export function WatchBlock() {
  return (
    <div>
      <Heading
        level={2}
        sizeOverride="text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight"
        className="max-w-3xl"
      >
        Why should you believe <span className="text-brand-gold">a word of this?</span>
      </Heading>

      <div className="mt-8 grid gap-x-12 gap-y-6 lg:mt-12 lg:grid-cols-12 lg:items-baseline">
        <p className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-brand-gold sm:text-4xl lg:col-span-5">
          {watchContent.answer}
        </p>
        <p className="max-w-xl font-body text-base leading-relaxed text-ink-inverse/75 lg:col-span-7">
          {watchContent.body}
        </p>
      </div>

      <div className="mt-10 lg:mt-14">
        {watchContent.video?.type === "youtube" ? (
          <VideoFacade videoId={watchContent.video.videoId} title={watchContent.title} />
        ) : watchContent.video?.type === "direct" ? (
          <VideoFacadeDirect
            src={watchContent.video.src}
            poster={watchContent.video.poster}
            title={watchContent.title}
          />
        ) : (
          /*
           * The held plane: the film's own title card before the film
           * exists. Mobile lets the copy set the height; sm and up locks
           * the 16:9 frame the player will occupy, so the composition does
           * not shift on release day.
           */
          <div className="relative flex w-full flex-col justify-end overflow-hidden bg-brand-green sm:aspect-video">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-8 bg-brand-green-deep [clip-path:polygon(0_0,100%_0,100%_100%)] sm:h-12 lg:h-16"
            />
            <div className="px-6 pb-8 pt-20 sm:p-10 lg:p-14">
              <p className="max-w-xl border-t-2 border-brand-gold pt-5 font-display text-3xl font-semibold leading-none tracking-tight text-ink-inverse sm:text-4xl lg:text-5xl">
                {watchContent.coming.line}
              </p>
              <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-ink-inverse/75">
                {watchContent.coming.detail}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
