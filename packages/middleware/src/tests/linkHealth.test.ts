import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// The link-health service wires unwrapRedirect (probing, covered by its own module) into per-row
// persistence + the batchFetch tally. unwrapRedirect is mocked as a seam; the fake db exercises the
// JS-level mapping (row shaping, null-url handling, update payloads). The SQL `where` filters
// (broken-only, url-not-null eligibility) are Drizzle query args the fake can't interpret — per the
// what-not-to-test skill those aren't retested here.

const fakeDb = createFakeDb();

type FakeUnwrapResult
  = | { kind: "ok";
    finalUrl: string;
    redirected: boolean; }
    | { kind: "blocked" }
    | { kind: "timeout" }
    | { kind: "http_error";
      status: number; }
      | { kind: "network_error" };

let unwrapImpl: (url: string) => FakeUnwrapResult = () => ({
  kind: "ok",
  finalUrl: "https://example.com",
  redirected: false,
});
const unwrapCalls: string[] = [];

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/services/redirectUnwrap", {
  namedExports: {
    unwrapRedirect: async (url: string) => {
      unwrapCalls.push(url);
      return unwrapImpl(url);
    },
  },
});

const {
  bulkCheckBookmarkLinks,
  classifyUnwrapResult,
  listBrokenBookmarks,
  recheckBookmarkLink,
} = await import("@/services/linkHealth");

function resetFixtures(): void {
  fakeDb.reset();
  unwrapCalls.length = 0;
  unwrapImpl = () => ({
    kind: "ok",
    finalUrl: "https://example.com",
    redirected: false,
  });
}

test("classifyUnwrapResult maps every probe outcome", () => {
  assert.deepEqual(classifyUnwrapResult({
    kind: "ok",
    finalUrl: "https://example.com",
    redirected: false,
  }), {
    status: "ok",
    detail: null,
  });
  assert.deepEqual(classifyUnwrapResult({
    kind: "http_error",
    status: 404,
  }), {
    status: "broken",
    detail: "404",
  });
  assert.deepEqual(classifyUnwrapResult({
    kind: "timeout",
  }), {
    status: "broken",
    detail: "timeout",
  });
  assert.deepEqual(classifyUnwrapResult({
    kind: "network_error",
  }), {
    status: "broken",
    detail: "network_error",
  });
  assert.deepEqual(classifyUnwrapResult({
    kind: "blocked",
  }), {
    status: "broken",
    detail: "blocked",
  });
});

test("listBrokenBookmarks shapes rows and drops url-less ones", async () => {
  resetFixtures();
  const checkedAt = new Date("2026-08-09T10:00:00Z");
  fakeDb.setRows(schema.bookmarks, [
    {
      id: "b1",
      title: "Dead page",
      url: "https://example.com/dead",
      detail: "404",
      checkedAt,
    },
    {
      id: "b2",
      title: "Never-checked timestamp",
      url: "https://example.com/other",
      detail: "timeout",
      checkedAt: null,
    },
    // A url-less row can't really be "broken", but the mapper must not emit url: null.
    {
      id: "b3",
      title: "URL-less hub",
      url: null,
      detail: null,
      checkedAt: null,
    },
  ]);

  const broken = await listBrokenBookmarks();
  assert.deepEqual(broken, [
    {
      id: "b1",
      title: "Dead page",
      url: "https://example.com/dead",
      detail: "404",
      checkedAt: checkedAt.toISOString(),
    },
    {
      id: "b2",
      title: "Never-checked timestamp",
      url: "https://example.com/other",
      detail: "timeout",
      checkedAt: null,
    },
  ]);
});

test("bulkCheckBookmarkLinks tallies alive vs broken and persists each outcome", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [
    {
      id: "alive",
      url: "https://example.com/alive",
    },
    {
      id: "dead",
      url: "https://example.com/dead",
    },
  ]);
  unwrapImpl = url =>
    (url.endsWith("/dead")
      ? {
        kind: "http_error",
        status: 410,
      }
      : {
        kind: "ok",
        finalUrl: url,
        redirected: false,
      });

  const progress: [number, number][] = [];
  const result = await bulkCheckBookmarkLinks((processed, total) => {
    progress.push([processed, total]);
  });

  assert.deepEqual(result, {
    fetched: 1,
    failed: 1,
  });
  assert.deepEqual(unwrapCalls.sort(), [
    "https://example.com/alive",
    "https://example.com/dead",
  ]);
  assert.deepEqual(progress, [[2, 2]]);
  // One update per bookmark, each carrying the classified outcome.
  assert.equal(fakeDb.updated.length, 2);
  const payloads = fakeDb.updated.map(u => u.values as {
    linkCheckStatus: string;
    linkCheckDetail: string | null;
    linkCheckedAt: Date;
  });
  const statuses = payloads.map(p => p.linkCheckStatus).sort();
  assert.deepEqual(statuses, ["broken", "ok"]);
  const brokenPayload = payloads.find(p => p.linkCheckStatus === "broken");
  assert.equal(brokenPayload?.linkCheckDetail, "410");
  assert.ok(payloads.every(p => p.linkCheckedAt instanceof Date));
});

test("recheckBookmarkLink persists and returns the fresh outcome", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, [
    {
      id: "b1",
      url: "https://example.com/page",
    },
  ]);
  unwrapImpl = () => ({
    kind: "timeout",
  });

  const result = await recheckBookmarkLink("b1");
  assert.equal(result.status, "broken");
  assert.equal(result.detail, "timeout");
  assert.ok(typeof result.checkedAt === "string" && !Number.isNaN(Date.parse(result.checkedAt)));
  assert.equal(fakeDb.updated.length, 1);
});

test("recheckBookmarkLink 404s on a missing or url-less bookmark", async () => {
  resetFixtures();
  fakeDb.setRows(schema.bookmarks, []);
  await assert.rejects(() => recheckBookmarkLink("missing"), (err: Error & { statusCode?: number }) => {
    assert.equal(err.statusCode, 404);
    return true;
  });

  fakeDb.setRows(schema.bookmarks, [
    {
      id: "hub",
      url: null,
    },
  ]);
  await assert.rejects(() => recheckBookmarkLink("hub"), (err: Error & { statusCode?: number }) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
  assert.equal(fakeDb.updated.length, 0);
});
