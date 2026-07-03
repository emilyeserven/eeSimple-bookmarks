import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { channelUrlFromKey } from "@eesimple/types";
import { fetchChannelAvatarUrlViaApi, fetchYouTubeMetadata, parseIsoDuration, parseYouTubeVideo } from "@/services/youtube";
import { channelKeyFromUrl } from "@/services/youtubeChannels";

// Pure-helper tests run without a live database or network, matching the `websites` style.

test("parseYouTubeVideo extracts the id from watch, short, and path-style URLs", () => {
  assert.deepEqual(parseYouTubeVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), {
    videoId: "dQw4w9WgXcQ",
  });
  assert.deepEqual(parseYouTubeVideo("https://youtu.be/dQw4w9WgXcQ"), {
    videoId: "dQw4w9WgXcQ",
  });
  assert.deepEqual(parseYouTubeVideo("https://youtube.com/shorts/dQw4w9WgXcQ"), {
    videoId: "dQw4w9WgXcQ",
  });
  assert.deepEqual(parseYouTubeVideo("https://m.youtube.com/embed/dQw4w9WgXcQ?start=10"), {
    videoId: "dQw4w9WgXcQ",
  });
});

test("parseYouTubeVideo returns null for non-YouTube or malformed URLs", () => {
  assert.equal(parseYouTubeVideo("https://example.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseYouTubeVideo("https://www.youtube.com/watch?v=tooShort"), null);
  assert.equal(parseYouTubeVideo("https://www.youtube.com/"), null);
  assert.equal(parseYouTubeVideo("not a url"), null);
});

test("parseIsoDuration converts ISO-8601 time durations to seconds", () => {
  assert.equal(parseIsoDuration("PT45S"), 45);
  assert.equal(parseIsoDuration("PT4M20S"), 260);
  assert.equal(parseIsoDuration("PT1H2M3S"), 3723);
  assert.equal(parseIsoDuration("PT2H"), 7200);
});

test("parseIsoDuration returns null for empty or non-time durations", () => {
  assert.equal(parseIsoDuration("PT"), null);
  assert.equal(parseIsoDuration("P1D"), null);
  assert.equal(parseIsoDuration("garbage"), null);
});

test("channelKeyFromUrl normalizes handles, channel ids, and vanity paths", () => {
  assert.equal(channelKeyFromUrl("https://www.youtube.com/@Veritasium"), "@veritasium");
  assert.equal(channelKeyFromUrl("https://www.youtube.com/channel/UCabc123"), "UCabc123");
  assert.equal(channelKeyFromUrl("https://www.youtube.com/c/SomeName"), "somename");
  assert.equal(channelKeyFromUrl("not a url"), null);
});

test("channelUrlFromKey reconstructs a browsable channel page URL", () => {
  // A handle round-trips to the `/@handle` page.
  assert.equal(channelUrlFromKey("@veritasium"), "https://www.youtube.com/@veritasium");
  // A full channel id (UC + 22 chars) routes through `/channel/`.
  assert.equal(
    channelUrlFromKey("UCHnyfMqiRRG1u-2MsSQLbXA"),
    "https://www.youtube.com/channel/UCHnyfMqiRRG1u-2MsSQLbXA",
  );
  // A bare vanity name falls back to the `/c/` path.
  assert.equal(channelUrlFromKey("somename"), "https://www.youtube.com/c/somename");
});

// --- fetchYouTubeMetadata: network-mocked diagnostics + extraction ---

const VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const OEMBED_OK = JSON.stringify({
  title: "Some Title",
  author_name: "Some Channel",
  person_url: "https://www.youtube.com/@somechannel",
  thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
});

/** Install a `global.fetch` stub routing oEmbed vs watch-page requests, plus a `console.warn` silencer. */
function stubNetwork(handlers: { oembed: () => Response;
  watch: () => Response; }): () => void {
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  console.warn = () => undefined;
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    return url.includes("/oembed") ? handlers.oembed() : handlers.watch();
  }) as typeof global.fetch;
  return () => {
    global.fetch = originalFetch;
    console.warn = originalWarn;
  };
}

test("fetchYouTubeMetadata extracts duration and date from ytInitialPlayerResponse JSON", async () => {
  const restore = stubNetwork({
    oembed: () => new Response(OEMBED_OK, {
      headers: {
        "content-type": "application/json",
      },
    }),
    watch: () => new Response(
      "<html><head></head><body><script>var ytInitialPlayerResponse = {"
      + "\"videoDetails\":{\"lengthSeconds\":\"272\"},"
      + "\"microformat\":{\"playerMicroformatRenderer\":{\"publishDate\":\"2024-06-15T00:00:00-07:00\"}}};"
      + "</script></body></html>",
    ),
  });
  try {
    const meta = await fetchYouTubeMetadata(VIDEO_URL);
    assert.ok(meta);
    assert.equal(meta.durationSeconds, 272);
    assert.equal(meta.datePosted, "2024-06-15");
    assert.deepEqual(meta.warnings, []);
  }
  finally {
    restore();
  }
});

test("fetchYouTubeMetadata warns with the reason when the watch-page fetch fails", async () => {
  const restore = stubNetwork({
    oembed: () => new Response(OEMBED_OK, {
      headers: {
        "content-type": "application/json",
      },
    }),
    watch: () => new Response("", {
      status: 403,
    }),
  });
  try {
    const meta = await fetchYouTubeMetadata(VIDEO_URL);
    assert.ok(meta);
    assert.equal(meta.durationSeconds, null);
    assert.equal(meta.datePosted, null);
    assert.ok(meta.warnings.includes("watch-page fetch failed: http_error 403"));
  }
  finally {
    restore();
  }
});

test("fetchYouTubeMetadata warns when the watch page omits duration and date", async () => {
  const restore = stubNetwork({
    oembed: () => new Response(OEMBED_OK, {
      headers: {
        "content-type": "application/json",
      },
    }),
    watch: () => new Response("<html><head></head><body>no useful data</body></html>"),
  });
  try {
    const meta = await fetchYouTubeMetadata(VIDEO_URL);
    assert.ok(meta);
    assert.equal(meta.durationSeconds, null);
    assert.equal(meta.datePosted, null);
    assert.ok(meta.warnings.includes("duration not found in watch page"));
    assert.ok(meta.warnings.includes("date not found in watch page"));
  }
  finally {
    restore();
  }
});

afterEach(() => {
  delete process.env.YOUTUBE_API_KEY;
});

test("fetchYouTubeMetadata uses the Data API for duration/date when YOUTUBE_API_KEY is set", async () => {
  process.env.YOUTUBE_API_KEY = "test-key";
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  console.warn = () => undefined;
  // The watch page would say 272s; the Data API says 600s — the API must win when keyed.
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/youtube/v3/videos")) {
      return new Response(JSON.stringify({
        items: [{
          snippet: {
            publishedAt: "2023-01-02T00:00:00Z",
            description: "From the Data API.",
          },
          contentDetails: {
            duration: "PT10M",
          },
        }],
      }), {
        headers: {
          "content-type": "application/json",
        },
      });
    }
    return url.includes("/oembed")
      ? new Response(OEMBED_OK, {
        headers: {
          "content-type": "application/json",
        },
      })
      : new Response("<html><head></head><body>\"lengthSeconds\":\"272\"</body></html>");
  }) as typeof global.fetch;
  try {
    const meta = await fetchYouTubeMetadata(VIDEO_URL);
    assert.ok(meta);
    assert.equal(meta.durationSeconds, 600);
    assert.equal(meta.datePosted, "2023-01-02");
    assert.equal(meta.description, "From the Data API.");
  }
  finally {
    global.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

// --- fetchChannelAvatarUrlViaApi: Tier 2 channel-avatar lookup ---

test("fetchChannelAvatarUrlViaApi returns null when no YouTube API key is configured", async () => {
  assert.equal(await fetchChannelAvatarUrlViaApi("@veritasium"), null);
});

test("fetchChannelAvatarUrlViaApi routes @handle, channel id, and vanity keys to the matching lookup param", async () => {
  process.env.YOUTUBE_API_KEY = "test-key";
  const originalFetch = global.fetch;
  const seenUrls: string[] = [];
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    seenUrls.push(url);
    return new Response(JSON.stringify({
      items: [{
        snippet: {
          thumbnails: {
            high: {
              url: "https://yt3.googleusercontent.com/high.jpg",
            },
          },
        },
      }],
    }), {
      headers: {
        "content-type": "application/json",
      },
    });
  }) as typeof global.fetch;
  try {
    assert.equal(await fetchChannelAvatarUrlViaApi("@veritasium"), "https://yt3.googleusercontent.com/high.jpg");
    assert.equal(await fetchChannelAvatarUrlViaApi("UCHnyfMqiRRG1u-2MsSQLbXA"), "https://yt3.googleusercontent.com/high.jpg");
    assert.equal(await fetchChannelAvatarUrlViaApi("somename"), "https://yt3.googleusercontent.com/high.jpg");
    assert.ok(seenUrls[0].includes("forHandle=%40veritasium"));
    assert.ok(seenUrls[1].includes("id=UCHnyfMqiRRG1u-2MsSQLbXA"));
    assert.ok(seenUrls[2].includes("forUsername=somename"));
  }
  finally {
    global.fetch = originalFetch;
  }
});

test("fetchChannelAvatarUrlViaApi returns null on a non-ok response or a missing thumbnail", async () => {
  process.env.YOUTUBE_API_KEY = "test-key";
  const originalFetch = global.fetch;
  try {
    global.fetch = (async () => new Response("", {
      status: 403,
    })) as typeof global.fetch;
    assert.equal(await fetchChannelAvatarUrlViaApi("@veritasium"), null);

    global.fetch = (async () => new Response(JSON.stringify({
      items: [],
    }), {
      headers: {
        "content-type": "application/json",
      },
    })) as typeof global.fetch;
    assert.equal(await fetchChannelAvatarUrlViaApi("@veritasium"), null);
  }
  finally {
    global.fetch = originalFetch;
  }
});

test("fetchYouTubeMetadata falls back to itemprop microdata for duration and date", async () => {
  const restore = stubNetwork({
    oembed: () => new Response(OEMBED_OK, {
      headers: {
        "content-type": "application/json",
      },
    }),
    watch: () => new Response(
      "<html><head></head><body>"
      + "<meta itemprop=\"duration\" content=\"PT4M32S\">"
      + "<meta itemprop=\"datePublished\" content=\"2024-06-15\">"
      + "</body></html>",
    ),
  });
  try {
    const meta = await fetchYouTubeMetadata(VIDEO_URL);
    assert.ok(meta);
    assert.equal(meta.durationSeconds, 272);
    assert.equal(meta.datePosted, "2024-06-15");
    assert.deepEqual(meta.warnings, []);
  }
  finally {
    restore();
  }
});
