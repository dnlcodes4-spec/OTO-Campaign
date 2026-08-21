import Image from "next/image";
import type { Poster } from "@/content/posters";

/*
 * Unlike GalleryGrid, these are fixed build-time assets (see content/posters.ts),
 * never empty and never failing to load, so there is no filter state, empty
 * state, or error fallback to build. Each poster renders at its own natural
 * portrait ratio rather than being cropped to a shared box: the point is the
 * full designed artwork, not a photo grid.
 */
type PosterGridProps = {
  posters: Poster[];
};

export function PosterGrid({ posters }: PosterGridProps) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posters.map((poster) => (
        <figure key={poster.id} className="flex flex-col gap-3">
          <div className="relative aspect-[2368/3349] w-full overflow-hidden bg-brand-green-deep">
            <Image
              src={poster.src}
              alt={poster.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <a
            href={poster.src}
            download={poster.downloadName}
            className="inline-flex items-center justify-center gap-2 border border-ink/20 py-2.5 font-body text-sm font-medium text-ink transition-colors hover:border-ink/40 hover:text-brand-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
          >
            Download
          </a>
        </figure>
      ))}
    </div>
  );
}
