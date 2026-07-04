import assert from "node:assert/strict";
import { test } from "node:test";

import { buildEntityNameRows } from "@/services/entityNames";

test("buildEntityNameRows keeps entries, assigns sortOrder in array order, and finds no primary", () => {
  const {
    rows, primaryValue,
  } = buildEntityNameRows("bookmark", "b1", [
    {
      languageId: "ja",
      value: "進撃の巨人",
    },
    {
      languageId: "en",
      value: "Attack on Titan",
    },
  ]);
  assert.equal(primaryValue, null);
  assert.deepEqual(rows.map(row => [row.languageId, row.value, row.sortOrder, row.isPrimary]), [
    ["ja", "進撃の巨人", 0, false],
    ["en", "Attack on Titan", 1, false],
  ]);
  assert.equal(rows[0]?.ownerType, "bookmark");
  assert.equal(rows[0]?.ownerId, "b1");
});

test("buildEntityNameRows returns the primary value to mirror into the base column", () => {
  const {
    rows, primaryValue,
  } = buildEntityNameRows("category", "c1", [
    {
      languageId: "ja",
      value: " 東京 ",
      isPrimary: true,
    },
    {
      languageId: "en",
      value: "Tokyo",
    },
  ]);
  // The primary value is trimmed, matching the stored row value.
  assert.equal(primaryValue, "東京");
  assert.equal(rows[0]?.value, "東京");
  assert.equal(rows[0]?.isPrimary, true);
  assert.equal(rows[1]?.isPrimary, false);
});

test("buildEntityNameRows dedupes by languageId (first wins)", () => {
  const {
    rows,
  } = buildEntityNameRows("tag", "t1", [
    {
      languageId: "en",
      value: "First",
    },
    {
      languageId: "en",
      value: "Duplicate",
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.value, "First");
});

test("buildEntityNameRows drops blank values", () => {
  const {
    rows,
  } = buildEntityNameRows("tag", "t1", [
    {
      languageId: "en",
      value: "   ",
    },
    {
      languageId: "ja",
      value: "名前",
    },
  ]);
  assert.deepEqual(rows.map(row => row.value), ["名前"]);
  // sortOrder is compacted after the dropped entry.
  assert.equal(rows[0]?.sortOrder, 0);
});

test("buildEntityNameRows rejects more than one primary", () => {
  assert.throws(
    () => buildEntityNameRows("bookmark", "b1", [
      {
        languageId: "ja",
        value: "A",
        isPrimary: true,
      },
      {
        languageId: "en",
        value: "B",
        isPrimary: true,
      },
    ]),
    /at most one primary name/,
  );
});
