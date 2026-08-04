import type { GalleryItem } from "@/content/gallery";
import { GalleryItemCard } from "./GalleryItemCard";

type GalleryGridProps = {
  items: GalleryItem[];
};

export function GalleryGrid({ items }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <p className="font-display text-2xl font-semibold">Nothing here yet</p>
        <p className="font-body text-sm text-ink/70">No photos yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <GalleryItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
