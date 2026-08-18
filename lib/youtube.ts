export type ChannelVideo = {
  videoId: string;
  title: string;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#38": "&",
  "#39": "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#?\w+);/g, (match, name) => ENTITIES[name] ?? match);
}

function parseEntries(xml: string, limit: number): ChannelVideo[] {
  const videos: ChannelVideo[] = [];
  const entryPattern = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch: RegExpExecArray | null;

  while (videos.length < limit && (entryMatch = entryPattern.exec(xml))) {
    const entry = entryMatch[1];
    const videoId = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry)?.[1];
    const title = /<title>([^<]*)<\/title>/.exec(entry)?.[1];
    if (videoId && title) {
      videos.push({ videoId, title: decodeEntities(title) });
    }
  }

  return videos;
}

/*
 * The channel's public RSS feed, no API key or quota, always ordered newest
 * first, so "the 6 most recent uploads" is just "the first 6 entries." Any
 * failure (network, non-200, a body that isn't the feed's XML) collapses to
 * an empty array: callers treat "nothing yet" and "couldn't reach YouTube"
 * identically, falling back to the held plane rather than surfacing an
 * error.
 */
export async function getChannelVideos(channelId: string, limit = 6): Promise<ChannelVideo[]> {
  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return [];

    const xml = await response.text();
    return parseEntries(xml, limit);
  } catch {
    return [];
  }
}
