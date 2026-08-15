export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  posterUrl?: string;
  caption: string;
  createdAt: string;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  return [];
}
