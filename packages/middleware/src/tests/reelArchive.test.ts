import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { BookmarkReelArchiveRow } from "@/db/schema";
import { extractReelVideoUrl, reelArchiveFromRow } from "@/services/reelArchive";

// `extractReelVideoUrl` is exercised by stubbing `globalThis.fetch` to stand in for the Browserless
// `/chromium/function` call (no real browser/network), mirroring redirectUnwrap.test.ts.

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.HOSTED_METADATA_ENDPOINT;
});

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

test("extractReelVideoUrl returns the video URL + dimensions from Browserless", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  globalThis.fetch = (async () =>
    jsonResponse({
      videoUrl: "https://scontent.cdninstagram.com/reel.mp4",
      width: 720,
      height: 1280,
    })) as typeof fetch;
  const result = await extractReelVideoUrl("https://www.instagram.com/reel/DZrfWBznYVQ/");
  assert.deepEqual(result, {
    videoUrl: "https://scontent.cdninstagram.com/reel.mp4",
    width: 720,
    height: 1280,
  });
});

test("extractReelVideoUrl tolerates a { data: … } wrapper and missing dimensions", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  globalThis.fetch = (async () =>
    jsonResponse({
      data: {
        videoUrl: "https://scontent.cdninstagram.com/reel.mp4",
      },
    })) as typeof fetch;
  const result = await extractReelVideoUrl("https://www.instagram.com/reel/DZrfWBznYVQ/");
  assert.deepEqual(result, {
    videoUrl: "https://scontent.cdninstagram.com/reel.mp4",
    width: null,
    height: null,
  });
});

test("extractReelVideoUrl returns null without fetching when Browserless is unconfigured", async () => {
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    return Promise.reject(new Error("should not fetch"));
  }) as typeof fetch;
  assert.equal(await extractReelVideoUrl("https://www.instagram.com/reel/DZrfWBznYVQ/"), null);
  assert.equal(called, false);
});

test("extractReelVideoUrl returns null when no video URL is exposed", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  globalThis.fetch = (async () =>
    jsonResponse({
      videoUrl: null,
    })) as typeof fetch;
  assert.equal(await extractReelVideoUrl("https://www.instagram.com/reel/DZrfWBznYVQ/"), null);
});

test("extractReelVideoUrl returns null on a Browserless HTTP error", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  globalThis.fetch = (async () =>
    new Response("nope", {
      status: 500,
    })) as typeof fetch;
  assert.equal(await extractReelVideoUrl("https://www.instagram.com/reel/DZrfWBznYVQ/"), null);
});

test("reelArchiveFromRow maps a row to the wire shape with a versioned serving URL", () => {
  const createdAt = new Date("2026-06-30T12:00:00.000Z");
  const row: BookmarkReelArchiveRow = {
    bookmarkId: "bm-1",
    objectKey: "bookmarks/bm-1-reel.mp4",
    contentType: "video/mp4",
    byteSize: 1234,
    width: 720,
    height: 1280,
    durationSeconds: null,
    sourceUrl: "https://www.instagram.com/reel/DZrfWBznYVQ/",
    createdAt,
  };
  assert.deepEqual(reelArchiveFromRow(row), {
    url: `/api/bookmarks/bm-1/reel-archive?v=${createdAt.getTime()}`,
    contentType: "video/mp4",
    byteSize: 1234,
    width: 720,
    height: 1280,
    durationSeconds: null,
    sourceUrl: "https://www.instagram.com/reel/DZrfWBznYVQ/",
    createdAt: "2026-06-30T12:00:00.000Z",
  });
});
