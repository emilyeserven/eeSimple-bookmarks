import assert from "node:assert/strict";
import { test } from "node:test";

import {
  channelUrlFromKey,
  isYouTubeVideoUrl,
  parseYouTubeVideo,
  youtubeEmbedUrl,
} from "./youtube.js";

const ID = "dQw4w9WgXcQ"; // a valid 11-char id

test("parseYouTubeVideo handles youtu.be short links", () => {
  assert.deepEqual(parseYouTubeVideo(`https://youtu.be/${ID}`), {
    videoId: ID,
  });
});

test("parseYouTubeVideo handles watch?v= on www and bare host", () => {
  assert.deepEqual(parseYouTubeVideo(`https://www.youtube.com/watch?v=${ID}`), {
    videoId: ID,
  });
  assert.deepEqual(parseYouTubeVideo(`https://youtube.com/watch?v=${ID}&t=10s`), {
    videoId: ID,
  });
});

test("parseYouTubeVideo handles shorts / embed / live / v paths", () => {
  for (const kind of ["shorts", "embed", "live", "v"]) {
    assert.deepEqual(
      parseYouTubeVideo(`https://www.youtube.com/${kind}/${ID}`),
      {
        videoId: ID,
      },
      kind,
    );
  }
});

test("parseYouTubeVideo handles youtube subdomains (e.g. m.youtube.com)", () => {
  assert.deepEqual(parseYouTubeVideo(`https://m.youtube.com/watch?v=${ID}`), {
    videoId: ID,
  });
});

test("parseYouTubeVideo returns null for non-videos and malformed ids", () => {
  assert.equal(parseYouTubeVideo("https://example.com/watch?v=abc"), null);
  assert.equal(parseYouTubeVideo("https://www.youtube.com/watch?v=tooShort"), null);
  assert.equal(parseYouTubeVideo("https://youtu.be/"), null);
  assert.equal(parseYouTubeVideo("not a url"), null);
  assert.equal(parseYouTubeVideo("https://www.youtube.com/channel/UC123"), null);
});

test("isYouTubeVideoUrl mirrors parseYouTubeVideo", () => {
  assert.equal(isYouTubeVideoUrl(`https://youtu.be/${ID}`), true);
  assert.equal(isYouTubeVideoUrl("https://example.com"), false);
});

test("youtubeEmbedUrl builds a nocookie embed URL by default, or null", () => {
  assert.equal(youtubeEmbedUrl(`https://youtu.be/${ID}`), `https://www.youtube-nocookie.com/embed/${ID}`);
  assert.equal(youtubeEmbedUrl("https://example.com"), null);
});

test("youtubeEmbedUrl honors the useNoCookie flag", () => {
  assert.equal(
    youtubeEmbedUrl(`https://youtu.be/${ID}`, true),
    `https://www.youtube-nocookie.com/embed/${ID}`,
  );
  assert.equal(youtubeEmbedUrl(`https://youtu.be/${ID}`, false), `https://www.youtube.com/embed/${ID}`);
  assert.equal(youtubeEmbedUrl("https://example.com", false), null);
});

test("channelUrlFromKey routes handles, channel ids, and vanity names", () => {
  assert.equal(channelUrlFromKey("@somehandle"), "https://www.youtube.com/@somehandle");
  assert.equal(
    channelUrlFromKey("UCabcdefghijklmnopqrstuv"),
    "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv",
  );
  assert.equal(channelUrlFromKey("vanityname"), "https://www.youtube.com/c/vanityname");
  assert.equal(channelUrlFromKey("  @trimmed  "), "https://www.youtube.com/@trimmed");
});
