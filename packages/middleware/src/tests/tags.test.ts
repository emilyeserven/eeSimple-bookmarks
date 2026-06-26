import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tag } from "@eesimple/types";
import {
  buildTagTree,
  collectSubtreeIds,
  computeTagBookmarkCounts,
  matchTagIdsByTitle,
  titleMatchesTagName,
  wouldCreateCycle,
} from "@/services/tags";

// Pure-helper tests run without a live database, matching the `isValidUrl` style.

const flat: Tag[] = [
  {
    id: "dev",
    name: "dev",
    slug: "dev",
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "tools",
    name: "tools",
    slug: "tools",
    parentId: "dev",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "cli",
    name: "cli",
    slug: "cli",
    parentId: "tools",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "work",
    name: "work",
    slug: "work",
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

test("collectSubtreeIds returns a tag and all its descendants", () => {
  assert.deepEqual([...collectSubtreeIds(flat, "dev")].sort(), ["cli", "dev", "tools"]);
  assert.deepEqual([...collectSubtreeIds(flat, "tools")].sort(), ["cli", "tools"]);
  assert.deepEqual([...collectSubtreeIds(flat, "cli")], ["cli"]);
});

test("buildTagTree nests children under their parents", () => {
  const roots = buildTagTree(flat);
  assert.equal(roots.length, 2); // dev, work
  const dev = roots.find(node => node.id === "dev");
  assert.ok(dev);
  assert.equal(dev.children[0]?.id, "tools");
  assert.equal(dev.children[0]?.children[0]?.id, "cli");
});

test("wouldCreateCycle rejects reparenting under self or a descendant", () => {
  assert.equal(wouldCreateCycle(flat, "dev", "dev"), true);
  assert.equal(wouldCreateCycle(flat, "dev", "cli"), true);
  assert.equal(wouldCreateCycle(flat, "tools", "cli"), true);
  // Moving into an unrelated subtree is allowed.
  assert.equal(wouldCreateCycle(flat, "tools", "work"), false);
});

test("computeTagBookmarkCounts counts subtree (distinct) and own (no-descendant) bookmarks", () => {
  // dev → tools → cli, plus a separate root "work". b4 sits on both dev and cli.
  const links = [
    {
      tagId: "dev",
      bookmarkId: "b1",
    },
    {
      tagId: "tools",
      bookmarkId: "b2",
    },
    {
      tagId: "cli",
      bookmarkId: "b3",
    },
    {
      tagId: "dev",
      bookmarkId: "b4",
    },
    {
      tagId: "cli",
      bookmarkId: "b4",
    },
    {
      tagId: "work",
      bookmarkId: "b5",
    },
  ];
  const counts = computeTagBookmarkCounts(flat, links);

  // dev's subtree spans b1–b4 (b4 deduped across dev + cli); only b1 sits on dev alone.
  assert.deepEqual(counts.get("dev"), {
    subtree: 4,
    own: 1,
  });
  // tools spans its own b2 and descendant cli's b3/b4; b2 is tools-only.
  assert.deepEqual(counts.get("tools"), {
    subtree: 3,
    own: 1,
  });
  // cli is a leaf, so its subtree and own counts match.
  assert.deepEqual(counts.get("cli"), {
    subtree: 2,
    own: 2,
  });
  assert.deepEqual(counts.get("work"), {
    subtree: 1,
    own: 1,
  });
});

// --- titleMatchesTagName / matchTagIdsByTitle (auto-tag-from-title automation) ---

test("titleMatchesTagName matches whole words case-insensitively", () => {
  assert.equal(titleMatchesTagName("Learning React Hooks", "react"), true);
  assert.equal(titleMatchesTagName("REACT in depth", "React"), true);
  assert.equal(titleMatchesTagName("A guide to react.", "react"), true);
});

test("titleMatchesTagName does not match inside a larger word", () => {
  assert.equal(titleMatchesTagName("Martin's blog", "art"), false);
  assert.equal(titleMatchesTagName("Reactor design", "react"), false);
});

test("titleMatchesTagName handles punctuated and multi-word tag names", () => {
  assert.equal(titleMatchesTagName("Best sci-fi of 2026", "sci-fi"), true);
  assert.equal(titleMatchesTagName("Notes on C++ templates", "C++"), true);
  assert.equal(titleMatchesTagName("Machine learning basics", "machine learning"), true);
});

test("titleMatchesTagName ignores empty/whitespace tag names", () => {
  assert.equal(titleMatchesTagName("Anything", ""), false);
  assert.equal(titleMatchesTagName("Anything", "   "), false);
});

test("matchTagIdsByTitle returns the ids of every matching tag", () => {
  const tagList = [
    {
      id: "t-react",
      name: "react",
    },
    {
      id: "t-css",
      name: "css",
    },
    {
      id: "t-art",
      name: "art",
    },
  ];
  assert.deepEqual(matchTagIdsByTitle("Styling React with CSS", tagList), ["t-react", "t-css"]);
  assert.deepEqual(matchTagIdsByTitle("Martin's portfolio", tagList), []);
  assert.deepEqual(matchTagIdsByTitle("", tagList), []);
});
