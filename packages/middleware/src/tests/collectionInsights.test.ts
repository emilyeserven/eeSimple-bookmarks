import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// The insights service selects small column sets and does every aggregation in exported pure
// helpers — the fake db (fixture rows per table, no SQL interpretation) exercises the composition,
// and the helpers are asserted directly for the bucketing/breakdown edge cases.

const fakeDb = createFakeDb();

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});

const {
  bucketAddedPerMonth,
  buildBreakdown,
  getCollectionInsights,
  lastTwelveMonths,
} = await import("@/services/collectionInsights");

const NOW = new Date("2026-08-09T12:00:00Z");

test("lastTwelveMonths spans the trailing year oldest-first, across a year boundary", () => {
  const months = lastTwelveMonths(NOW);
  assert.equal(months.length, 12);
  assert.equal(months[0], "2025-09");
  assert.equal(months[3], "2025-12");
  assert.equal(months[4], "2026-01");
  assert.equal(months[11], "2026-08");
});

test("bucketAddedPerMonth zero-fills, buckets by UTC month, and drops out-of-window rows", () => {
  const points = bucketAddedPerMonth([
    {
      createdAt: new Date("2026-08-01T00:30:00Z"),
    },
    {
      createdAt: new Date("2026-08-20T23:00:00Z"),
    },
    {
      createdAt: new Date("2025-12-31T23:59:59Z"),
    },
    // Older than the 12-month window — dropped from the chart.
    {
      createdAt: new Date("2024-01-15T00:00:00Z"),
    },
  ], NOW);
  assert.equal(points.length, 12);
  assert.deepEqual(points[0], {
    month: "2025-09",
    count: 0,
  });
  assert.deepEqual(points[3], {
    month: "2025-12",
    count: 1,
  });
  assert.deepEqual(points[11], {
    month: "2026-08",
    count: 2,
  });
  assert.equal(points.reduce((sum, p) => sum + p.count, 0), 3);
});

function bookmarkRow(overrides: {
  categoryId?: string | null;
  mediaTypeId?: string | null;
  websiteId?: string | null;
  linkCheckStatus?: string | null;
  createdAt?: Date;
}) {
  return {
    createdAt: overrides.createdAt ?? new Date("2026-08-01T00:00:00Z"),
    categoryId: overrides.categoryId ?? null,
    mediaTypeId: overrides.mediaTypeId ?? null,
    websiteId: overrides.websiteId ?? null,
    linkCheckStatus: overrides.linkCheckStatus ?? null,
  };
}

test("buildBreakdown sorts desc with name tie-break, cuts at N, and routes NULL/unknown to noneCount", () => {
  const groups = new Map([
    ["c1", {
      name: "Beta",
      slug: "beta",
    }],
    ["c2", {
      name: "Alpha",
      slug: "alpha",
    }],
    // Slug not backfilled yet — the slice still counts, it just can't be linked.
    ["c3", {
      name: "Gamma",
      slug: null,
    }],
  ]);
  const rows = [
    bookmarkRow({
      categoryId: "c1",
    }),
    bookmarkRow({
      categoryId: "c1",
    }),
    bookmarkRow({
      categoryId: "c2",
    }),
    bookmarkRow({
      categoryId: "c2",
    }),
    bookmarkRow({
      categoryId: "c3",
    }),
    bookmarkRow({
      categoryId: null,
    }),
    // Unknown id (no names entry) — defensively counted as none, like NULL.
    bookmarkRow({
      categoryId: "ghost",
    }),
  ];

  const breakdown = buildBreakdown(rows, "categoryId", groups, 2);
  // c1 and c2 tie at 2 — Alpha (c2) wins the name tie-break.
  assert.deepEqual(breakdown.slices, [
    {
      id: "c2",
      name: "Alpha",
      slug: "alpha",
      count: 2,
    },
    {
      id: "c1",
      name: "Beta",
      slug: "beta",
      count: 2,
    },
  ]);
  assert.equal(breakdown.otherCount, 1); // Gamma's single bookmark beyond top 2
  assert.equal(breakdown.noneCount, 2); // the NULL row + the unknown-id row
});

test("getCollectionInsights composes totals, chart, and breakdowns from the fixture tables", async () => {
  fakeDb.reset();
  fakeDb.setRows(schema.bookmarks, [
    bookmarkRow({
      categoryId: "c1",
      websiteId: "w1",
      linkCheckStatus: "broken",
    }),
    bookmarkRow({
      categoryId: "c1",
      mediaTypeId: "m1",
      linkCheckStatus: "ok",
    }),
    bookmarkRow({}),
  ]);
  fakeDb.setRows(schema.categories, [
    {
      id: "c1",
      name: "Dev",
      slug: "dev",
    },
  ]);
  fakeDb.setRows(schema.mediaTypes, [
    {
      id: "m1",
      name: "Video",
      slug: "video",
    },
  ]);
  fakeDb.setRows(schema.websites, [
    {
      id: "w1",
      name: "GitHub",
      slug: "github",
    },
  ]);
  fakeDb.setRows(schema.tags, [
    {
      id: "t1",
    },
    {
      id: "t2",
    },
  ]);

  const insights = await getCollectionInsights(NOW);
  assert.deepEqual(insights.totals, {
    bookmarks: 3,
    categories: 1,
    tags: 2,
    websites: 1,
    brokenLinks: 1,
  });
  assert.equal(insights.addedPerMonth.length, 12);
  assert.equal(insights.addedPerMonth[11]?.count, 3);
  assert.deepEqual(insights.byCategory.slices, [
    {
      id: "c1",
      name: "Dev",
      slug: "dev",
      count: 2,
    },
  ]);
  assert.equal(insights.byCategory.noneCount, 1);
  assert.deepEqual(insights.byMediaType.slices, [
    {
      id: "m1",
      name: "Video",
      slug: "video",
      count: 1,
    },
  ]);
  assert.deepEqual(insights.topWebsites.slices, [
    {
      id: "w1",
      name: "GitHub",
      slug: "github",
      count: 1,
    },
  ]);
  assert.ok(!Number.isNaN(Date.parse(insights.capturedAt)));
});
