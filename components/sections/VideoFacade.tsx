"use client";

import { useState } from "react";

/*
 * The one client component the film section needs, kept to exactly the
 * click-state it exists for: facade first, iframe only after the visitor
 * chooses. No YouTube JavaScript touches the page until then; the facade is
 * a plain thumbnail img plus a real play control, and the swap loads the
 * privacy-enhanced youtube-nocookie.com embed with autoplay so one click
 * means one click.
 *
 * Thumbnail resilience: YouTube serves maxresdefault.jpg only for videos
 * uploaded at high resolution, so a failed load steps down to hqdefault.jpg,
 * and a second failure drops to the flat brand plane the site uses for every
 * absent image (the CampaignImage pattern). A bad or stale id can dull the
 * facade but never break it, and the play control keeps working through
 * every step.
 */

type VideoFacadeProps = {
  videoId: string;
  title: string;
};

type ThumbState = "maxres" | "hq" | "plane";

const THUMB_FILE: Record<Exclude<ThumbState, "plane">, string> = {
  maxres: "maxresdefault.jpg",
  hq: "hqdefault.jpg",
};

export function VideoFacade({ videoId, title }: VideoFacadeProps) {
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState<ThumbState>("maxres");

  if (playing) {
    return (
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title}`}
      className="group relative block aspect-video w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
    >
      {thumb === "plane" ? (
        <span aria-hidden="true" className="absolute inset-0 bg-brand-green" />
      ) : (
        /*
         * Plain img by design: the poster frame lives on YouTube's CDN,
         * outside next/image's optimizer allowlist, and the two-step
         * onError fallback needs the element's native error event.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${videoId}/${THUMB_FILE[thumb]}`}
          alt={title}
          onError={() => setThumb(thumb === "maxres" ? "hq" : "plane")}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/*
       * The play control in the site's own grammar: a flat gold slab in the
       * bottom-left corner, its right edge cut on the page's diagonal, a
       * solid ink triangle and the instruction in display type. No floating
       * circle badge.
       */}
      <span className="absolute bottom-0 left-0 flex items-center gap-3 bg-brand-gold py-3 pl-5 pr-12 transition-colors [clip-path:polygon(0_0,100%_0,calc(100%-2rem)_100%,0_100%)] group-hover:bg-brand-gold-deep sm:py-4 sm:pl-6 sm:pr-14">
        <svg viewBox="0 0 14 16" aria-hidden="true" className="h-4 w-3.5 fill-ink">
          <polygon points="0,0 14,8 0,16" />
        </svg>
        <span className="font-display text-base font-semibold text-ink sm:text-lg">
          Play the film
        </span>
      </span>
    </button>
  );
}
