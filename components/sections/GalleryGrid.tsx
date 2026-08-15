"use client";

import { useState } from "react";
import type { GalleryItem } from "@/content/gallery";
import { GalleryItemCard } from "./GalleryItemCard";

type Filter = "all" | "image" | "video";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Photos" },
  { value: "video", label: "Videos" },
];

type GalleryGridProps = {
  items: GalleryItem[];
};

export function GalleryGrid({ items }: GalleryGridProps) {
  const [filter, setFilter] = useState<Filter>("all");

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <p className="font-display text-2xl font-semibold">Nothing here yet</p>
        <p className="font-body text-sm text-ink/70">No photos yet. Check back soon.</p>
      </div>
    );
  }

  const filteredItems = filter === "all" ? items : items.filter((item) => item.type === filter);

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Filter gallery" className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={
              filter === value
                ? "bg-brand-green px-4 py-2 font-body text-sm font-medium text-ink-inverse"
                : "border border-ink/20 px-4 py-2 font-body text-sm text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-center">
          <p className="font-display text-2xl font-semibold">Nothing here yet</p>
          <p className="font-body text-sm text-ink/70">
            No {filter === "video" ? "videos" : "photos"} yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <GalleryItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
