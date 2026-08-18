import { getSiteContent } from "@/lib/content/site-content";

export type WatchContent = {
  /*
   * The channel WatchBlock fetches its grid from (see lib/youtube.ts). No
   * manual swap needed any more: whatever the campaign uploads to this
   * channel is what visitors see, newest first, up to the section's tile
   * count. Resolved once from https://www.youtube.com/@otosenate2027 — if
   * the channel ever moves to a new handle, re-resolve its UC... id the
   * same way and update this one value.
   *
   * Excluded from content/schemas/watch.ts, the same way `video` used to
   * be: a stray CMS save could otherwise persist a malicious channel id
   * into the oto_site_content row. This value is read from
   * watchContentDefault directly (see app/(site)/page.tsx), never from
   * getWatchContent()'s merged result.
   */
  channelId: string;
  answer: string;
  body: string;
  /*
   * The grid's padding tile: a real, self-hosted clip (Cloudinary) that
   * fills whatever slots the channel doesn't have YouTube uploads for yet.
   * It always sits in the last slot, so as real uploads arrive it keeps
   * getting pushed one slot further down until 6 real videos fill the grid
   * on their own and it drops out. Manual and one-way, same as the old
   * single-video swap was: deleting this specific item from /admin/gallery
   * does not update this file, so re-point it at a different gallery clip
   * (or the eventual polished campaign film) if this one ever gets removed.
   *
   * Excluded from the CMS schema and read from watchContentDefault
   * directly too, for the same reason as channelId above.
   */
  filler: {
    src: string;
    poster: string;
    title: string;
  };
};

export const watchContentDefault: WatchContent = {
  channelId: "UCuCLxWXxseZ0gc922HXuaMg",
  answer: "Watch him say it himself.",
  body: "Every answer on this page is a commitment the candidate makes in his own voice. The campaign is putting that case on film so you can weigh the messenger along with the message, and hold him to every word of it.",
  filler: {
    src: "https://res.cloudinary.com/dgols34tu/video/upload/v1786781549/oto-gallery/whatsapp-video-2026-08-09-at-12-56-15-am-1.mp4",
    poster:
      "https://res.cloudinary.com/dgols34tu/video/upload/so_3,w_1600,c_fill,q_auto,f_jpg/oto-gallery/whatsapp-video-2026-08-09-at-12-56-15-am-1.jpg",
    title: "OTO for Senate: the campaign film",
  },
};

export async function getWatchContent() {
  return getSiteContent("watch", watchContentDefault);
}
