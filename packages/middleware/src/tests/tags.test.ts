import assert from "node:assert/strict";
import { test } from "node:test";
import type { EntityName, Tag } from "@eesimple/types";
import {
  buildTagTree,
  computeTagBookmarkCounts,
  matchTagIdsByTitle,
  titleMatchesTerm,
  wouldCreateCycle,
} from "@/services/tags";
import { collectSubtreeIds } from "@/utils/parentTree";

/** A minimal language-labelled name for candidate fixtures. */
function nm(value: string): EntityName {
  return {
    id: value,
    language: {
      id: value,
      name: value,
      slug: value,
      isoCode: null,
    },
    value,
    isPrimary: false,
    sortOrder: 0,
  };
}

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

// --- auto-tag-from-title automation (re-exported from @eesimple/types; full matrix lives in
// packages/types/src/titleTags.test.ts — these guard the re-export + romanized-aware signature) ---

test("titleMatchesTerm is re-exported and keeps Latin whole-word semantics", () => {
  assert.equal(titleMatchesTerm("Learning React Hooks", "react"), true);
  assert.equal(titleMatchesTerm("Martin's blog", "art"), false);
});

test("matchTagIdsByTitle matches name and romanizedName across title and romanizedName", () => {
  const tagList = [
    {
      id: "t-react",
      name: "react",
      romanizedName: null,
    },
    {
      id: "t-busan",
      name: "부산",
      romanizedName: "Busan",
    },
  ];
  // Native name inside a Korean compound title.
  assert.deepEqual(matchTagIdsByTitle(["부산광역시"], tagList), ["t-busan"]);
  // Romanized name against a Latin title.
  assert.deepEqual(
    matchTagIdsByTitle(["Ferry from Busan to Fukuoka"], tagList),
    ["t-busan"],
  );
  // Latin whole-word plus a romanizedName haystack.
  assert.deepEqual(matchTagIdsByTitle(["Styling React with CSS"], tagList), ["t-react"]);
  assert.deepEqual(matchTagIdsByTitle(["旅行", "Busan trip"], tagList), ["t-busan"]);
  assert.deepEqual(matchTagIdsByTitle([""], tagList), []);
});

test("matchTagIdsByTitle matches a tag's language-labelled names against the bookmark's names", () => {
  const tagList = [
    {
      id: "t-eva",
      name: "エヴァンゲリオン",
      romanizedName: null,
      names: [nm("エヴァンゲリオン"), nm("Evangelion")],
    },
  ];
  // Bookmark titled only in English still matches the tag via the tag's English `names` value.
  assert.deepEqual(matchTagIdsByTitle(["Watching Evangelion tonight"], tagList), ["t-eva"]);
  // And a bookmark whose names carry the Japanese form matches the same tag.
  assert.deepEqual(matchTagIdsByTitle(["My list", "新世紀エヴァンゲリオン"], tagList), ["t-eva"]);
});
