"use client";

import { useState } from "react";

/*
 * VideoFacade's sibling for a self-hosted (Cloudinary) clip instead of a
 * YouTube id: same facade-then-play grammar and accessibility contract, but
 * the poster comes straight from the caller (a Cloudinary-derived frame, no
 * i.ytimg.com step-down chain needed) and the swap loads the mp4 inline
 * instead of an iframe embed, since there is no third-party player to load
 * lazily. Used today as the grid's filler tile (see VideoGrid): a real clip
 * padding out the spaces the channel doesn't have YouTube uploads for yet.
 */

type VideoFacadeDirectProps = {
  src: string;
  poster: string;
  title: string;
};

export function VideoFacadeDirect({ src, poster, title }: VideoFacadeDirectProps) {
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video w-full">
        <video
          src={src}
          poster={poster}
          aria-label={title}
          autoPlay
          controls
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Watch: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
    >
      {posterFailed ? (
        <span aria-hidden="true" className="absolute inset-0 bg-brand-green" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- poster lives on Cloudinary, outside next/image's optimizer allowlist
        <img
          src={poster}
          alt={title}
          onError={() => setPosterFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <span className="absolute bottom-0 left-0 flex items-center gap-3 bg-brand-gold py-3 pl-5 pr-12 transition-colors [clip-path:polygon(0_0,100%_0,calc(100%-2rem)_100%,0_100%)] group-hover:bg-brand-gold-deep sm:py-4 sm:pl-6 sm:pr-14">
        <svg viewBox="0 0 14 16" aria-hidden="true" className="h-4 w-3.5 fill-ink">
          <polygon points="0,0 14,8 0,16" />
        </svg>
        <span className="font-display text-base font-semibold text-ink sm:text-lg">Watch</span>
      </span>
    </button>
  );
}
