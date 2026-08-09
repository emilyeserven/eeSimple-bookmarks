import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// The scan's SQL surface is one whole-table select; all tiering/bucketing/dedup happens in JS, so
// the fake db exercises the real logic directly. `listWebsites`/`normalizeDomain` are mocked as a
// seam (the real ones join tags/channels); the pure key helpers from @eesimple/types run for real.

const fakeDb = createFakeDb();

interface FakeWebsite {
  domain: string;
  paramRules: { pathSuffix: string;
    matchMode?: "suffix" | "contains";
    params: string[]; }[];
  shortenedLinks: { domain: string }[];
}

let websiteFixtures: FakeWebsite[] = [];

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/services/websites", {
  namedExports: {
    listWebsites: async () => websiteFixtures,
    normalizeDomain: (url: string) => {
      try {
        return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
      }
      catch {
        return null;
      }
    },
  },
});

const {
  scanDuplicateGroups,
} = await import("@/services/bookmarkDuplicateGroups");

interface RowOverrides {
  id: string;
  url?: string | null;
  title?: string;
  createdAt?: Date;
  isbn?: string | null;
  plexRatingKey?: string | null;
  kavitaSeriesId?: number | null;
  feedUrl?: string | null;
}

function row(overrides: RowOverrides) {
  return {
    url: null,
    title: `Bookmark ${overrides.id}`,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    isbn: null,
    plexRatingKey: null,
    kavitaSeriesId: null,
    feedUrl: null,
    ...overrides,
  };
}

function resetFixtures(rows: ReturnType<typeof row>[], websites: FakeWebsite[] = []): void {
  fakeDb.reset();
  fakeDb.setRows(schema.bookmarks, rows);
  websiteFixtures = websites;
}

test("identical urls group as same-url; same page with junk params groups as same-page", async () => {
  resetFixtures([
    row({
      id: "a1",
      url: "https://example.com/post",
    }),
    row({
      id: "a2",
      url: "https://example.com/post",
    }),
    row({
      id: "b1",
      url: "https://example.com/other?utm_source=x",
    }),
    row({
      id: "b2",
      url: "https://example.com/other?ref=y",
    }),
  ]);
  const result = await scanDuplicateGroups();
  assert.equal(result.scannedCount, 4);
  assert.deepEqual(result.groups.map(g => [g.kind, g.members.map(m => m.id).sort()]), [
    ["same-url", ["a1", "a2"]],
    ["same-page", ["b1", "b2"]],
  ]);
});

test("param rules separate identity params and resolve through shortened domains", async () => {
  const youtube: FakeWebsite = {
    domain: "youtube.com",
    paramRules: [{
      pathSuffix: "/watch",
      params: ["v"],
    }],
    shortenedLinks: [{
      domain: "youtu.be",
    }],
  };
  resetFixtures([
    // Same path, different ?v= — NOT duplicates.
    row({
      id: "v1",
      url: "https://www.youtube.com/watch?v=abc",
    }),
    row({
      id: "v2",
      url: "https://www.youtube.com/watch?v=def",
    }),
    // Same ?v=, different junk params — duplicates.
    row({
      id: "d1",
      url: "https://www.youtube.com/watch?v=xyz&t=42",
    }),
    row({
      id: "d2",
      url: "https://www.youtube.com/watch?v=xyz&feature=share",
    }),
  ], [youtube]);
  const result = await scanDuplicateGroups();
  assert.deepEqual(result.groups.map(g => [g.kind, g.members.map(m => m.id).sort()]), [
    ["same-page", ["d1", "d2"]],
  ]);
});

test("shared identity fields group with identityField set; url-less rows are eligible", async () => {
  resetFixtures([
    row({
      id: "i1",
      isbn: "9780131103627",
    }),
    row({
      id: "i2",
      url: "https://shop.example/book",
      isbn: "9780131103627",
    }),
    row({
      id: "p1",
      plexRatingKey: "123",
    }),
    row({
      id: "p2",
      plexRatingKey: "123",
    }),
    row({
      id: "k1",
      kavitaSeriesId: 7,
    }),
    row({
      id: "k2",
      kavitaSeriesId: 7,
    }),
    row({
      id: "f1",
      feedUrl: "https://example.com/feed.xml",
    }),
    row({
      id: "f2",
      feedUrl: "https://example.com/feed.xml",
    }),
  ]);
  const result = await scanDuplicateGroups();
  assert.deepEqual(
    result.groups.map(g => [g.kind, g.identityField, g.members.map(m => m.id).sort()]),
    [
      ["shared-identity", "isbn", ["i1", "i2"]],
      ["shared-identity", "plexRatingKey", ["p1", "p2"]],
      ["shared-identity", "kavitaSeriesId", ["k1", "k2"]],
      ["shared-identity", "feedUrl", ["f1", "f2"]],
    ],
  );
});

test("url-less and unparseable urls are excluded from the URL tiers", async () => {
  resetFixtures([
    row({
      id: "n1",
      url: null,
    }),
    row({
      id: "n2",
      url: null,
    }),
    row({
      id: "u1",
      url: "not a url",
    }),
    row({
      id: "u2",
      url: "not a url",
    }),
  ]);
  const result = await scanDuplicateGroups();
  assert.deepEqual(result.groups, []);
});

test("same normalized title lands in possibleGroups; short titles are excluded", async () => {
  resetFixtures([
    row({
      id: "t1",
      title: "  The  ROADMAP ",
    }),
    row({
      id: "t2",
      title: "the roadmap",
    }),
    row({
      id: "s1",
      title: "abc",
    }),
    row({
      id: "s2",
      title: "ABC",
    }),
  ]);
  const result = await scanDuplicateGroups();
  assert.deepEqual(result.groups, []);
  assert.deepEqual(result.possibleGroups.map(g => [g.kind, g.members.map(m => m.id).sort()]), [
    ["same-title", ["t1", "t2"]],
  ]);
});

test("a member set already found by a surer tier is not re-reported", async () => {
  resetFixtures([
    row({
      id: "x1",
      url: "https://example.com/a",
      title: "Duplicate Article",
      isbn: "111",
    }),
    row({
      id: "x2",
      url: "https://example.com/a",
      title: "Duplicate Article",
      isbn: "111",
    }),
  ]);
  const result = await scanDuplicateGroups();
  assert.deepEqual(result.groups.map(g => [g.kind, g.members.map(m => m.id).sort()]), [
    ["same-url", ["x1", "x2"]],
  ]);
  assert.deepEqual(result.possibleGroups, []);
});

test("members sort oldest-first and groups sort by kind then size", async () => {
  resetFixtures([
    row({
      id: "new",
      url: "https://example.com/a",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
    }),
    row({
      id: "old",
      url: "https://example.com/a",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    }),
    row({
      id: "i1",
      isbn: "222",
    }),
    row({
      id: "i2",
      isbn: "222",
    }),
    row({
      id: "i3",
      isbn: "222",
    }),
  ]);
  const result = await scanDuplicateGroups();
  assert.deepEqual(result.groups.map(g => g.kind), ["same-url", "shared-identity"]);
  assert.deepEqual(result.groups[0]!.members.map(m => m.id), ["old", "new"]);
  assert.equal(result.groups[0]!.members[0]!.createdAt, "2026-01-01T00:00:00.000Z");
});
