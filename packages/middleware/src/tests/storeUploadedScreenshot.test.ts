import assert from "node:assert/strict";
import { mock, test } from "node:test";
import sharp from "sharp";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// `storeUploadedScreenshot` stores a client-captured (browser-extension) screenshot into the
// bookmark's screenshot slot. It reaches for the module-level `db` singleton and the object store
// directly, so those are mocked via `mock.module` *before* the dynamic import (ES module imports are
// cached process-wide). Only `@/db` and the leaf `@/utils/objectStore` are mocked — the gallery and
// app-settings services run for real against the fake db (they tolerate empty fixtures), so the mock
// surface stays small. `processImage` (sharp) runs for real against a tiny generated PNG, so the
// not_found / bad_image / success branches are exercised end to end without a live Postgres or S3.

const fakeDb = createFakeDb();
const putObjectCalls: { key: string }[] = [];

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/utils/objectStore", {
  namedExports: {
    isObjectStoreConfigured: () => true,
    putObject: async (key: string) => {
      putObjectCalls.push({
        key,
      });
    },
    getObjectStream: async () => null,
    getObjectRange: async () => null,
    listObjects: async () => [],
    getObjectBytes: async () => null,
    deleteObject: async () => undefined,
    ensureBucket: async () => undefined,
  },
});

const {
  storeUploadedScreenshot,
} = await import("@/services/bookmarkImages");

/** A tiny valid PNG that `processImage` can decode. */
async function tinyPng(): Promise<Buffer> {
  return sharp({
    create: {
      width: 40,
      height: 30,
      channels: 3,
      background: {
        r: 10,
        g: 120,
        b: 200,
      },
    },
  }).png().toBuffer();
}

test("storeUploadedScreenshot stores a screenshot and returns the screenshot-sourced wire shape", async () => {
  fakeDb.reset();
  putObjectCalls.length = 0;
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
  }]);

  const result = await storeUploadedScreenshot("bm-1", await tinyPng());

  assert.ok(typeof result !== "string", `expected a BookmarkImage, got ${result}`);
  assert.equal(result.source, "screenshot");
  assert.equal(result.isMain, false);
  assert.ok(result.url.includes("/api/bookmarks/bm-1/screenshot"));
  // Bytes were stored under the bookmark's stable screenshot key.
  assert.deepEqual(putObjectCalls, [{
    key: "bookmarks/bm-1-screenshot.webp",
  }]);
  // The upsert targeted the screenshots table with null capture settings (a client upload).
  const insert = fakeDb.inserted.find(i => i.table === schema.bookmarkScreenshots);
  assert.ok(insert, "expected a bookmark_screenshots insert");
  const row = insert.rows as unknown as Record<string, unknown>;
  assert.equal(row.source, "screenshot");
  assert.equal(row.delayMs, null);
  assert.equal(row.viewportWidth, null);
  assert.equal(row.scrollDistance, null);
});

test("storeUploadedScreenshot returns \"not_found\" for an unknown bookmark", async () => {
  fakeDb.reset();
  putObjectCalls.length = 0;
  fakeDb.setRows(schema.bookmarks, []);

  const result = await storeUploadedScreenshot("missing", await tinyPng());

  assert.equal(result, "not_found");
  assert.equal(putObjectCalls.length, 0, "must not store anything when the bookmark is gone");
});

test("storeUploadedScreenshot returns \"bad_image\" for non-image bytes", async () => {
  fakeDb.reset();
  putObjectCalls.length = 0;
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
  }]);

  const result = await storeUploadedScreenshot("bm-1", Buffer.from("definitely not an image"));

  assert.equal(result, "bad_image");
  assert.equal(putObjectCalls.length, 0, "must not store undecodable bytes");
});
