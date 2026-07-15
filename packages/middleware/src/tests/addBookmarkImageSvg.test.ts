import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// `addBookmarkImage` must accept an SVG as a bookmark's main image: the bytes are stored verbatim
// (vector passthrough) with an `image/svg+xml` content type rather than rejected as `bad_image` by
// the WebP pipeline. It reaches for the module-level `db` singleton and the object store directly,
// so both are mocked via `mock.module` *before* the dynamic import (ES module imports are cached
// process-wide). Only `@/db` and the leaf `@/utils/objectStore` are mocked — the gallery and
// app-settings services run for real against the fake db (they tolerate empty fixtures), keeping the
// mock surface small. Mirrors the `storeUploadedScreenshot` harness.

const fakeDb = createFakeDb();
const putObjectCalls: { key: string;
  body: Buffer;
  contentType: string; }[] = [];

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/utils/objectStore", {
  namedExports: {
    isObjectStoreConfigured: () => true,
    putObject: async (key: string, body: Buffer, contentType: string) => {
      putObjectCalls.push({
        key,
        body,
        contentType,
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
  addBookmarkImage,
} = await import("@/services/bookmarkImages");

test("addBookmarkImage stores an SVG verbatim as image/svg+xml under a .svg key", async () => {
  fakeDb.reset();
  putObjectCalls.length = 0;
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
  }]);

  const svg = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"48\" height=\"24\"><rect width=\"48\" height=\"24\"/></svg>");
  const result = await addBookmarkImage("bm-1", svg, "upload", {
    setMain: true,
  });

  assert.ok(typeof result !== "string", `expected a BookmarkImage, got ${result}`);
  assert.equal(result.source, "upload");
  assert.equal(result.isMain, true);
  // Bytes were stored unchanged (never rasterized) with the SVG content type + extension.
  assert.equal(putObjectCalls.length, 1);
  assert.equal(putObjectCalls[0].contentType, "image/svg+xml");
  assert.ok(putObjectCalls[0].key.endsWith(".svg"));
  assert.ok(putObjectCalls[0].body.equals(svg));
  // The inserted row records the SVG content type and the parsed dimensions.
  const insert = fakeDb.inserted.find(i => i.table === schema.bookmarkImages);
  assert.ok(insert, "expected a bookmark_images insert");
  const row = insert.rows as unknown as Record<string, unknown>;
  assert.equal(row.contentType, "image/svg+xml");
  assert.equal(row.width, 48);
  assert.equal(row.height, 24);
});
