"use client";

import { useEffect } from "react";
import { Button } from "@/components/primitives/Button";

type GalleryErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function GalleryError({ error, retry }: GalleryErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-2xl font-semibold">Could not load the gallery</p>
      <p className="font-body text-sm text-ink/70">
        Something went wrong fetching photos and video.
      </p>
      <Button onClick={retry} tone="red" variant="solid">
        Try again
      </Button>
    </div>
  );
}
