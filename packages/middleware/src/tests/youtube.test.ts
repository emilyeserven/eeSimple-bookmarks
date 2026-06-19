import assert from "node:assert/strict";
import { test } from "node:test";
import { channelUrlFromKey } from "@eesimple/types";
import { parseIsoDuration, parseYouTubeVideo } from "@/services/youtube";
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
