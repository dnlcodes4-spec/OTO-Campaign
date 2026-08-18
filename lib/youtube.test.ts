import { afterEach, expect, test, vi } from "vitest";
import { getChannelVideos } from "./youtube";

const CHANNEL_ID = "UCuCLxWXxseZ0gc922HXuaMg";

function feedXml(entries: Array<{ id: string; title: string }>) {
  const items = entries
    .map(
      (e) => `
 <entry>
  <id>yt:video:${e.id}</id>
  <yt:videoId>${e.id}</yt:videoId>
  <yt:channelId>${CHANNEL_ID}</yt:channelId>
  <title>${e.title}</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=${e.id}"/>
  <published>2026-08-17T20:40:31+00:00</published>
  <updated>2026-08-17T20:43:20+00:00</updated>
 </entry>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
 <yt:channelId>${CHANNEL_ID}</yt:channelId>
 <title>Oluwasegun Theophilus Oladimeji - OTO</title>${items}
</feed>`;
}

function mockFetchOnce(response: Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(response))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("returns the feed's videos as videoId/title pairs, in feed order", async () => {
  mockFetchOnce(
    new Response(
      feedXml([
        { id: "gF9ZDGZ5wSA", title: "Oto for Senate - Oyo South" },
        { id: "abc123XYZ00", title: "Town hall highlights" },
      ])
    )
  );

  const videos = await getChannelVideos(CHANNEL_ID);

  expect(videos).toEqual([
    { videoId: "gF9ZDGZ5wSA", title: "Oto for Senate - Oyo South" },
    { videoId: "abc123XYZ00", title: "Town hall highlights" },
  ]);
});

test("requests the channel's RSS feed with an hour-long revalidate", async () => {
  mockFetchOnce(new Response(feedXml([])));

  await getChannelVideos(CHANNEL_ID);

  expect(fetch).toHaveBeenCalledWith(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
    { next: { revalidate: 3600 } }
  );
});

test("caps the result to the given limit, keeping the earliest (newest) entries", async () => {
  mockFetchOnce(
    new Response(
      feedXml([
        { id: "aaaaaaaaaaa", title: "First" },
        { id: "bbbbbbbbbbb", title: "Second" },
        { id: "ccccccccccc", title: "Third" },
      ])
    )
  );

  const videos = await getChannelVideos(CHANNEL_ID, 2);

  expect(videos).toEqual([
    { videoId: "aaaaaaaaaaa", title: "First" },
    { videoId: "bbbbbbbbbbb", title: "Second" },
  ]);
});

test("decodes HTML entities in video titles", async () => {
  mockFetchOnce(
    new Response(feedXml([{ id: "aaaaaaaaaaa", title: "Roads &amp; bridges Q&#38;A" }]))
  );

  const videos = await getChannelVideos(CHANNEL_ID);

  expect(videos[0].title).toBe("Roads & bridges Q&A");
});

test("returns an empty array when the feed has no entries", async () => {
  mockFetchOnce(new Response(feedXml([])));

  expect(await getChannelVideos(CHANNEL_ID)).toEqual([]);
});

test("returns an empty array when the response is not ok", async () => {
  mockFetchOnce(new Response("not found", { status: 404 }));

  expect(await getChannelVideos(CHANNEL_ID)).toEqual([]);
});

test("returns an empty array when fetch rejects", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("network down")))
  );

  expect(await getChannelVideos(CHANNEL_ID)).toEqual([]);
});

test("returns an empty array when the response body isn't valid feed XML", async () => {
  mockFetchOnce(new Response("<html>not a feed</html>"));

  expect(await getChannelVideos(CHANNEL_ID)).toEqual([]);
});
