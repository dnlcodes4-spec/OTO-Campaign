import { GalleryManager } from "@/components/admin/GalleryManager";

export default function AdminGalleryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Gallery</h1>
      <GalleryManager />
    </div>
  );
}
