import type { Metadata } from "next";
import { getGalleryItems } from "@/content/gallery";
import { GalleryGrid } from "@/components/sections/GalleryGrid";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos and video from the OTO for Senate campaign trail.",
};

export default async function GalleryPage() {
  const items = await getGalleryItems();
  return <GalleryGrid items={items} />;
}
