import { Heading } from "@/components/primitives/Heading";
import { VideoGrid, type FillerVideo } from "./VideoGrid";
import type { ChannelVideo } from "@/lib/youtube";

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
 * The grid reads straight from the campaign's YouTube channel (see
 * lib/youtube.ts), up to 6 of its most recent uploads, newest first: no
 * content-file edit is the release any more, uploading to the channel is.
 * Real uploads always fill the first slots; content/watch.ts's filler clip
 * pads out whatever's left, always in the last slot, so it keeps getting
 * pushed further down as more real uploads land until 6 of them fill the
 * grid on their own (see VideoGrid). Every tile, real or filler, is the
 * same click-to-play facade grammar the section has always used: no
 * YouTube JavaScript loads until a specific tile is pressed.
 */
type WatchBlockProps = {
  /*
   * WatchBlock is nested inside HomePage's returned tree rather than being
   * the component under direct test/render (HomePage's own test renders
   * `await HomePage()` at the top level, and a Promise-returning component
   * nested inside that already-constructed tree can't be resolved by
   * React Testing Library), so it stays a plain (non-async) component and
   * takes its content as props from the page, which awaits both
   * `getWatchContent()` and `getChannelVideos()` once for the route.
   *
   * channelId and filler are excluded from content/schemas/watch.ts (the
   * same way video used to be), so they come in from watchContentDefault
   * rather than getWatchContent()'s CMS-merged result: filler is what
   * getChannelVideos() padded videos with, so it is passed straight
   * through here rather than re-derived.
   */
  videos: ChannelVideo[];
  filler: FillerVideo;
  answer: string;
  body: string;
};

export function WatchBlock({ videos, filler, answer, body }: WatchBlockProps) {
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
          {answer}
        </p>
        <p className="max-w-xl font-body text-base leading-relaxed text-ink-inverse/75 lg:col-span-7">
          {body}
        </p>
      </div>

      <div className="mt-10 lg:mt-14">
        <VideoGrid videos={videos} filler={filler} />
      </div>
    </div>
  );
}
