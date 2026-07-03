import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  lookupPodcastByItunesId,
  parsePodcastFeed,
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
