import assert from "node:assert/strict";
import { test } from "node:test";
import type { MediaType } from "@eesimple/types";
import {
  buildMediaTypeTree,
  computeMediaTypeBookmarkCounts,
} from "@/services/mediaTypes";

// Pure-helper tests run without a live database, matching the tags.test.ts style.

const flat: MediaType[] = [
  {
    id: "audio",
    name: "Audio",
    slug: "audio",
    description: null,
    icon: null,
    builtIn: true,
    hidden: false,
    sortOrder: 0,
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "podcast",
    name: "Podcast",
    slug: "podcast",
    description: null,
    icon: null,
    builtIn: true,
    hidden: false,
    sortOrder: 1,
    parentId: "audio",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "music",
    name: "Music",
    slug: "music",
    description: null,
    icon: null,
    builtIn: true,
    hidden: false,
    sortOrder: 2,
    parentId: "audio",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "video",
    name: "Video",
    slug: "video",
    description: null,
    icon: null,
    builtIn: true,
    hidden: false,
    sortOrder: 3,
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

test("buildMediaTypeTree nests children one level under their parent", () => {
  const roots = buildMediaTypeTree(flat);
  assert.equal(roots.length, 2); // Audio, Video
  const audio = roots.find(node => node.id === "audio");
  assert.ok(audio);
  assert.deepEqual(audio.children.map(child => child.id).sort(), ["music", "podcast"]);
  const video = roots.find(node => node.id === "video");
  assert.ok(video);
  assert.equal(video.children.length, 0);
});

test("computeMediaTypeBookmarkCounts counts subtree and own (single-valued) bookmarks", () => {
  // Two bookmarks directly on Audio, one on Podcast, one on Music, none on Video.
  const ids = ["audio", "audio", "podcast", "music"];
  const counts = computeMediaTypeBookmarkCounts(flat, ids);

  // Audio: 2 directly on it + 1 podcast + 1 music = 4 subtree; 2 own.
  assert.deepEqual(counts.get("audio"), {
    subtree: 4,
    own: 2,
  });
  // Leaf children: subtree equals own.
  assert.deepEqual(counts.get("podcast"), {
    subtree: 1,
    own: 1,
  });
  assert.deepEqual(counts.get("music"), {
    subtree: 1,
    own: 1,
  });
  assert.deepEqual(counts.get("video"), {
    subtree: 0,
    own: 0,
  });
});

test("computeMediaTypeBookmarkCounts ignores null media types", () => {
  const counts = computeMediaTypeBookmarkCounts(flat, [null, "video", null]);
  assert.deepEqual(counts.get("video"), {
    subtree: 1,
    own: 1,
  });
});
