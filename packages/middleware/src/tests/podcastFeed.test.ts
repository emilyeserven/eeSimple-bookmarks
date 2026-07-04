import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  extractApplePodcastsId,
  extractPocketCastsUuid,
  lookupPocketCastsByUuid,
  lookupPodcastByItunesId,
  parsePodcastFeed,
  resolvePodcastByUrl,
  resolvePodcastFeed,
  resolvePodcastProviderLinks,
  searchPodcasts,
  searchPodcastsPocketCasts,
} from "@/services/podcastFeed";

const SAMPLE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Reply All</title>
    <language>en-us</language>
    <itunes:author>Gimlet</itunes:author>
    <description>A podcast about the internet.</description>
    <itunes:image href="https://cdn.example.com/replyall.jpg"/>
    <item><title>#1 An Episode</title></item>
  </channel>
</rss>`;

// --- parsePodcastFeed: pure XML parsing, no network ---

test("parsePodcastFeed extracts title/author/description/image/language", () => {
  const parsed = parsePodcastFeed(SAMPLE_FEED);
  assert.ok(parsed);
  assert.equal(parsed.title, "Reply All");
  assert.equal(parsed.author, "Gimlet");
  assert.equal(parsed.description, "A podcast about the internet.");
  assert.equal(parsed.imageUrl, "https://cdn.example.com/replyall.jpg");
  assert.equal(parsed.languageCode, "en");
});

test("parsePodcastFeed falls back to <image><url> and managingEditor", () => {
  const feed = `<rss><channel>
    <title>Show</title>
    <managingEditor>host@example.com (Host Name)</managingEditor>
    <image><url>https://cdn.example.com/cover.png</url></image>
  </channel></rss>`;
  const parsed = parsePodcastFeed(feed);
  assert.ok(parsed);
  assert.equal(parsed.imageUrl, "https://cdn.example.com/cover.png");
  assert.equal(parsed.author, "host@example.com (Host Name)");
});

test("parsePodcastFeed drops a non-public image url", () => {
  const feed = `<rss><channel><title>X</title>
    <itunes:image href="http://127.0.0.1/secret.jpg" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"/>
  </channel></rss>`;
  const parsed = parsePodcastFeed(feed);
  assert.ok(parsed);
  assert.equal(parsed.imageUrl, null);
});

test("parsePodcastFeed returns null for non-RSS input", () => {
  assert.equal(parsePodcastFeed("<html><body>nope</body></html>"), null);
  assert.equal(parsePodcastFeed("not xml at all"), null);
});

// --- iTunes + feed fetch: stub global.fetch ---

const ITUNES_SEARCH_HIT = JSON.stringify({
  resultCount: 1,
  results: [{
    collectionId: 941907967,
    collectionName: "Reply All",
    artistName: "Gimlet",
    feedUrl: "https://feeds.megaphone.fm/replyall",
    collectionViewUrl: "https://podcasts.apple.com/us/podcast/id941907967",
    artworkUrl600: "https://cdn.example.com/replyall600.jpg",
    artworkUrl100: "https://cdn.example.com/replyall100.jpg",
  }],
});

const POCKET_CASTS_HIT = JSON.stringify({
  podcasts: [{
    uuid: "abc-123",
    title: "Reply All",
    author: "Gimlet",
    url: "https://feeds.megaphone.fm/replyall",
  }],
});

function stubByHost(handlers: { itunes?: () => Response;
  pocketCasts?: () => Response;
  feed?: () => Response; }): () => void {
  const original = global.fetch;
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("itunes.apple.com")) {
      return handlers.itunes?.() ?? new Response("{}", {
        status: 200,
      });
    }
    if (url.includes("pocketcasts.com")) {
      return handlers.pocketCasts?.() ?? new Response("{}", {
        status: 200,
      });
    }
    return handlers.feed?.() ?? new Response(SAMPLE_FEED, {
      status: 200,
    });
  }) as typeof fetch;
  return () => {
    global.fetch = original;
  };
}

afterEach(() => {
  // stubs restore themselves; nothing global to reset.
});

test("searchPodcasts maps iTunes results to PodcastSearchResult", async () => {
  const restore = stubByHost({
    itunes: () => new Response(ITUNES_SEARCH_HIT, {
      status: 200,
    }),
  });
  try {
    const results = await searchPodcasts("reply all");
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {
      provider: "itunes",
      itunesId: 941907967,
      pocketCastsUuid: null,
      name: "Reply All",
      author: "Gimlet",
      feedUrl: "https://feeds.megaphone.fm/replyall",
      itunesUrl: "https://podcasts.apple.com/us/podcast/id941907967",
      pocketCastsUrl: null,
      artworkUrl: "https://cdn.example.com/replyall600.jpg",
    });
  }
  finally {
    restore();
  }
});

test("searchPodcastsPocketCasts maps hits + builds a pca.st link", async () => {
  const restore = stubByHost({
    pocketCasts: () => new Response(POCKET_CASTS_HIT, {
      status: 200,
    }),
  });
  try {
    const results = await searchPodcastsPocketCasts("reply all");
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {
      provider: "pocketCasts",
      itunesId: null,
      pocketCastsUuid: "abc-123",
      name: "Reply All",
      author: "Gimlet",
      feedUrl: "https://feeds.megaphone.fm/replyall",
      itunesUrl: null,
      pocketCastsUrl: "https://pca.st/podcast/abc-123",
      artworkUrl: null,
    });
  }
  finally {
    restore();
  }
});

test("resolvePodcastProviderLinks matches the feed across Apple + Pocket Casts", async () => {
  const restore = stubByHost({
    itunes: () => new Response(ITUNES_SEARCH_HIT, {
      status: 200,
    }),
    pocketCasts: () => new Response(POCKET_CASTS_HIT, {
      status: 200,
    }),
  });
  try {
    const links = await resolvePodcastProviderLinks("Reply All", "https://feeds.megaphone.fm/replyall/");
    assert.deepEqual(links, {
      itunesId: 941907967,
      itunesUrl: "https://podcasts.apple.com/us/podcast/id941907967",
      pocketCastsUuid: "abc-123",
      pocketCastsUrl: "https://pca.st/podcast/abc-123",
    });
  }
  finally {
    restore();
  }
});

test("resolvePodcastProviderLinks returns nulls when no feed matches", async () => {
  const restore = stubByHost({
    itunes: () => new Response(ITUNES_SEARCH_HIT, {
      status: 200,
    }),
    pocketCasts: () => new Response(POCKET_CASTS_HIT, {
      status: 200,
    }),
  });
  try {
    const links = await resolvePodcastProviderLinks("Reply All", "https://different.example/feed");
    assert.deepEqual(links, {
      itunesId: null,
      itunesUrl: null,
      pocketCastsUuid: null,
      pocketCastsUrl: null,
    });
  }
  finally {
    restore();
  }
});

test("searchPodcasts returns [] for a blank term and on failure", async () => {
  assert.deepEqual(await searchPodcasts("   "), []);
  const restore = stubByHost({
    itunes: () => new Response("boom", {
      status: 500,
    }),
  });
  try {
    assert.deepEqual(await searchPodcasts("x"), []);
  }
  finally {
    restore();
  }
});

test("lookupPodcastByItunesId resolves a single entry", async () => {
  const restore = stubByHost({
    itunes: () => new Response(ITUNES_SEARCH_HIT, {
      status: 200,
    }),
  });
  try {
    const hit = await lookupPodcastByItunesId(941907967);
    assert.equal(hit?.feedUrl, "https://feeds.megaphone.fm/replyall");
  }
  finally {
    restore();
  }
});

test("resolvePodcastFeed fetches + parses a feed and echoes the feedUrl", async () => {
  const restore = stubByHost({
    feed: () => new Response(SAMPLE_FEED, {
      status: 200,
    }),
  });
  try {
    const result = await resolvePodcastFeed("https://feeds.megaphone.fm/replyall");
    assert.equal(result?.title, "Reply All");
    assert.equal(result?.feedUrl, "https://feeds.megaphone.fm/replyall");
    assert.equal(result?.itunesId, null);
  }
  finally {
    restore();
  }
});

test("resolvePodcastFeed refuses a non-public feed url", async () => {
  assert.equal(await resolvePodcastFeed("http://localhost/feed.xml"), null);
});

// --- extractApplePodcastsId: pure URL parsing, no network ---

test("extractApplePodcastsId parses a show page's trailing id", () => {
  assert.equal(
    extractApplePodcastsId("https://podcasts.apple.com/us/podcast/reply-all/id941907967"),
    941907967,
  );
  assert.equal(
    extractApplePodcastsId("https://itunes.apple.com/us/podcast/reply-all/id941907967?mt=2"),
    941907967,
  );
});

test("extractApplePodcastsId returns null for other hosts or missing id", () => {
  assert.equal(extractApplePodcastsId("https://feeds.megaphone.fm/replyall"), null);
  assert.equal(extractApplePodcastsId("https://podcasts.apple.com/us/podcast/reply-all"), null);
  assert.equal(extractApplePodcastsId("not a url"), null);
});

// --- extractPocketCastsUuid: pure URL parsing, no network ---

test("extractPocketCastsUuid parses a share page URL with a slug", () => {
  assert.equal(
    extractPocketCastsUuid("https://pocketcasts.com/podcast/oyasumi-japanese-with-shun/052cf240-0797-013a-d55a-0acc26574db2"),
    "052cf240-0797-013a-d55a-0acc26574db2",
  );
});

test("extractPocketCastsUuid parses the pca.st short form", () => {
  assert.equal(
    extractPocketCastsUuid("https://pca.st/podcast/052cf240-0797-013a-d55a-0acc26574db2"),
    "052cf240-0797-013a-d55a-0acc26574db2",
  );
});

test("extractPocketCastsUuid returns null for other hosts or a non-uuid trailing segment", () => {
  assert.equal(extractPocketCastsUuid("https://feeds.megaphone.fm/replyall"), null);
  assert.equal(extractPocketCastsUuid("https://pocketcasts.com/podcast/oyasumi-japanese-with-shun"), null);
  assert.equal(extractPocketCastsUuid("not a url"), null);
});

// --- lookupPocketCastsByUuid + Pocket Casts branch of resolvePodcastByUrl ---

function stubFetch(handler: (url: string) => Response): () => void {
  const original = global.fetch;
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    return handler(url);
  }) as typeof fetch;
  return () => {
    global.fetch = original;
  };
}

test("lookupPocketCastsByUuid resolves a direct (non-nested) response", async () => {
  const restore = stubFetch(() => new Response(JSON.stringify({
    uuid: "052cf240-0797-013a-d55a-0acc26574db2",
    title: "Oyasumi, Japanese with Shun",
    author: "Shun",
    url: "https://feeds.example.com/oyasumi.xml",
  }), {
    status: 200,
  }));
  try {
    const result = await lookupPocketCastsByUuid("052cf240-0797-013a-d55a-0acc26574db2");
    assert.deepEqual(result, {
      provider: "pocketCasts",
      itunesId: null,
      pocketCastsUuid: "052cf240-0797-013a-d55a-0acc26574db2",
      name: "Oyasumi, Japanese with Shun",
      author: "Shun",
      feedUrl: "https://feeds.example.com/oyasumi.xml",
      itunesUrl: null,
      pocketCastsUrl: "https://pca.st/podcast/052cf240-0797-013a-d55a-0acc26574db2",
      artworkUrl: null,
    });
  }
  finally {
    restore();
  }
});

test("lookupPocketCastsByUuid resolves a response nested under a `podcast` key", async () => {
  const restore = stubFetch(() => new Response(JSON.stringify({
    podcast: {
      uuid: "052cf240-0797-013a-d55a-0acc26574db2",
      title: "Oyasumi, Japanese with Shun",
      url: "https://feeds.example.com/oyasumi.xml",
    },
  }), {
    status: 200,
  }));
  try {
    const result = await lookupPocketCastsByUuid("052cf240-0797-013a-d55a-0acc26574db2");
    assert.equal(result?.name, "Oyasumi, Japanese with Shun");
    assert.equal(result?.feedUrl, "https://feeds.example.com/oyasumi.xml");
  }
  finally {
    restore();
  }
});

test("lookupPocketCastsByUuid returns null on failure or an unrecognized shape", async () => {
  const restore = stubFetch(() => new Response("boom", {
    status: 500,
  }));
  try {
    assert.equal(await lookupPocketCastsByUuid("052cf240-0797-013a-d55a-0acc26574db2"), null);
  }
  finally {
    restore();
  }
});

test("resolvePodcastByUrl resolves a Pocket Casts share URL via the uuid lookup", async () => {
  const restore = stubFetch(() => new Response(JSON.stringify({
    uuid: "052cf240-0797-013a-d55a-0acc26574db2",
    title: "Oyasumi, Japanese with Shun",
    author: "Shun",
    url: "https://feeds.example.com/oyasumi.xml",
  }), {
    status: 200,
  }));
  try {
    const result = await resolvePodcastByUrl(
      "https://pocketcasts.com/podcast/oyasumi-japanese-with-shun/052cf240-0797-013a-d55a-0acc26574db2",
    );
    assert.equal(result?.provider, "pocketCasts");
    assert.equal(result?.pocketCastsUuid, "052cf240-0797-013a-d55a-0acc26574db2");
    assert.equal(result?.feedUrl, "https://feeds.example.com/oyasumi.xml");
  }
  finally {
    restore();
  }
});

test("resolvePodcastByUrl falls back to scraping the share page when the uuid lookup fails", async () => {
  const restore = stubFetch((url) => {
    if (url.includes("podcast-api.pocketcasts.com")) {
      return new Response("boom", {
        status: 500,
      });
    }
    return new Response(
      "<html><head><meta property=\"og:title\" content=\"Oyasumi, Japanese with Shun\"/>"
      + "<meta property=\"og:image\" content=\"https://cdn.example.com/oyasumi.jpg\"/></head></html>",
      {
        status: 200,
      },
    );
  });
  try {
    const result = await resolvePodcastByUrl(
      "https://pocketcasts.com/podcast/oyasumi-japanese-with-shun/052cf240-0797-013a-d55a-0acc26574db2",
    );
    assert.equal(result?.provider, "pocketCasts");
    assert.equal(result?.name, "Oyasumi, Japanese with Shun");
    assert.equal(result?.artworkUrl, "https://cdn.example.com/oyasumi.jpg");
    assert.equal(result?.feedUrl, null);
  }
  finally {
    restore();
  }
});

// --- resolvePodcastByUrl: stub global.fetch ---

test("resolvePodcastByUrl resolves an Apple Podcasts show URL via the iTunes lookup", async () => {
  const restore = stubByHost({
    itunes: () => new Response(ITUNES_SEARCH_HIT, {
      status: 200,
    }),
  });
  try {
    const result = await resolvePodcastByUrl("https://podcasts.apple.com/us/podcast/reply-all/id941907967");
    assert.equal(result?.provider, "itunes");
    assert.equal(result?.itunesId, 941907967);
  }
  finally {
    restore();
  }
});

test("resolvePodcastByUrl falls back to parsing a raw feed URL", async () => {
  const restore = stubByHost({
    feed: () => new Response(SAMPLE_FEED, {
      status: 200,
    }),
  });
  try {
    const result = await resolvePodcastByUrl("https://feeds.megaphone.fm/replyall");
    assert.deepEqual(result, {
      provider: "feed",
      itunesId: null,
      pocketCastsUuid: null,
      name: "Reply All",
      author: "Gimlet",
      feedUrl: "https://feeds.megaphone.fm/replyall",
      itunesUrl: null,
      pocketCastsUrl: null,
      artworkUrl: "https://cdn.example.com/replyall.jpg",
    });
  }
  finally {
    restore();
  }
});

test("resolvePodcastByUrl returns null when the URL is neither an Apple show page nor a readable feed", async () => {
  const restore = stubByHost({
    feed: () => new Response("nope", {
      status: 404,
    }),
  });
  try {
    assert.equal(await resolvePodcastByUrl("https://example.com/nothing"), null);
  }
  finally {
    restore();
  }
});
