import { getSiteContent } from "@/lib/content/site-content";

export type VideoSource =
  | { type: "youtube"; videoId: string }
  | { type: "direct"; src: string; poster: string };

export type WatchContent = {
  /*
   * THE SWAP: when the client uploads the polished campaign film, replace
   * this with { type: "youtube", videoId } (the 11-character id, the v=
   * value in the watch URL). That one edit is the whole release: the
   * section drops its held plane (or the current direct clip) and renders
   * the click-to-load YouTube player on its own, nothing else changes.
   *
   * Until then it points at a real clip already migrated into the
   * oto_gallery Cloudinary account (see supabase/oto-gallery-schema.sql):
   * { type: "direct", src, poster }. That coupling is manual and one-way —
   * deleting this specific item from /admin/gallery does not update this
   * file, so the featured clip would 404. Re-run the swap above (to null,
   * to a different gallery clip, or to the real film) if that item ever
   * gets removed.
   */
  video: VideoSource | null;
  /*
   * Names the film for assistive tech everywhere it surfaces: the embed's
   * title attribute, the facade thumbnail's alt, the play control's label.
   */
  title: string;
  answer: string;
  body: string;
  /*
   * The held plane's copy while video is null. Written as a real promise
   * in the page's voice, not filler: the plane must read as designed, and
   * this is the only place its words live.
   */
  coming: {
    line: string;
    detail: string;
  };
};

export const watchContentDefault: WatchContent = {
  video: {
    type: "direct",
    src: "https://res.cloudinary.com/dgols34tu/video/upload/v1786781549/oto-gallery/whatsapp-video-2026-08-09-at-12-56-15-am-1.mp4",
    poster:
      "https://res.cloudinary.com/dgols34tu/video/upload/so_3,w_1600,c_fill,q_auto,f_jpg/oto-gallery/whatsapp-video-2026-08-09-at-12-56-15-am-1.jpg",
  },
  title: "OTO for Senate: the campaign film",
  answer: "Watch him say it himself.",
  body: "Every answer on this page is a commitment the candidate makes in his own voice. The campaign is putting that case on film so you can weigh the messenger along with the message, and hold him to every word of it.",
  coming: {
    line: "The film is coming.",
    detail: "",
  },
};

export async function getWatchContent() {
  return getSiteContent("watch", watchContentDefault);
}
