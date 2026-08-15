"use client";

import { useState } from "react";
import Image from "next/image";
import type { GalleryItem } from "@/content/gallery";

type GalleryItemCardProps = {
  item: GalleryItem;
};

export function GalleryItemCard({ item }: GalleryItemCardProps) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="group relative aspect-[4/5] overflow-hidden bg-brand-green-deep sm:aspect-square">
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
          <p className="font-body text-sm text-ink-inverse/80">This one did not load</p>
        </div>
      ) : item.type === "image" ? (
        <Image
          src={item.url}
          alt={item.caption}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <video
          src={item.url}
          poster={item.posterUrl}
          className="h-full w-full object-cover"
          controls
          onError={() => setFailed(true)}
        />
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-2 font-body text-xs text-ink-inverse opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
        {item.caption}
      </figcaption>
    </figure>
  );
}
