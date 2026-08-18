import type { ChannelVideo } from "@/lib/youtube";
import { VideoFacade } from "./VideoFacade";
import { VideoFacadeDirect } from "./VideoFacadeDirect";

export type FillerVideo = {
  src: string;
  poster: string;
  title: string;
};

type VideoGridProps = {
  videos: ChannelVideo[];
  filler?: FillerVideo;
};

const GRID_SIZE = 6;

/*
 * Real uploads always come first, newest first. The filler (the campaign's
 * own produced clip, self-hosted on Cloudinary) pads out whatever the
 * channel doesn't have YouTube uploads for yet, always in the last slot: as
 * more real videos arrive, the filler keeps getting pushed one slot further
 * down until 6 real uploads fill the grid on their own and it drops out
 * entirely. Never padded with more than the one filler tile, and never
 * padded past 6.
 */
export function VideoGrid({ videos, filler }: VideoGridProps) {
  const showFiller = filler !== undefined && videos.length < GRID_SIZE;

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
      {videos.map((video) => (
        <VideoFacade key={video.videoId} videoId={video.videoId} title={video.title} />
      ))}
      {showFiller && (
        <VideoFacadeDirect src={filler.src} poster={filler.poster} title={filler.title} />
      )}
    </div>
  );
}
