import assert from "node:assert/strict";
import { test } from "node:test";

import { buildEntityNameRows, planEntityNameBackfillRows } from "@/services/entityNames";

const IDS = {
  en: "en-id",
  ja: "ja-id",
  ko: "ko-id",
  zh: "zh-id",
};

test("planEntityNameBackfillRows: Korean title → single primary ko row", () => {
  const result = planEntityNameBackfillRows("bookmark", "b1", "강남", null, "ko", IDS);
  assert.deepEqual(result.rows, [
    {
      ownerType: "bookmark",
      ownerId: "b1",
      languageId: "ko-id",
      value: "강남",
      isPrimary: true,
      sortOrder: 0,
    },
  ]);
  assert.equal(result.undetermined, false);
  assert.equal(result.duplicateEnglish, false);
});

test("planEntityNameBackfillRows: Japanese title + romanized → ja primary + en romanized row", () => {
  const result = planEntityNameBackfillRows("movie", "m1", "進撃の巨人", "Shingeki no Kyojin", "ja", IDS);
  assert.deepEqual(result.rows, [
    {
      ownerType: "movie",
      ownerId: "m1",
      languageId: "ja-id",
      value: "進撃の巨人",
      isPrimary: true,
      sortOrder: 0,
    },
    {
      ownerType: "movie",
      ownerId: "m1",
      languageId: "en-id",
      value: "Shingeki no Kyojin",
      isPrimary: false,
      sortOrder: 1,
    },
  ]);
  assert.equal(result.undetermined, false);
});

test("planEntityNameBackfillRows: detected Chinese (Han fallback) → single primary zh row", () => {
  const result = planEntityNameBackfillRows("bookmark", "b9", "三国志", null, "zh", IDS);
  assert.deepEqual(result.rows, [
    {
      ownerType: "bookmark",
      ownerId: "b9",
      languageId: "zh-id",
      value: "三国志",
      isPrimary: true,
      sortOrder: 0,
    },
  ]);
  assert.equal(result.undetermined, false);
});

test("planEntityNameBackfillRows: undetermined (Han-only, no preference) with no romanized → no rows", () => {
  const result = planEntityNameBackfillRows("category", "c1", "三国志", null, null, IDS);
  assert.deepEqual(result.rows, []);
  assert.equal(result.undetermined, true);
  assert.equal(result.duplicateEnglish, false);
});

test("planEntityNameBackfillRows: undetermined with romanized → lone non-primary en row, no primary", () => {
  const result = planEntityNameBackfillRows("category", "c1", "三国志", "Sanguozhi", null, IDS);
  assert.deepEqual(result.rows, [
    {
      ownerType: "category",
      ownerId: "c1",
      languageId: "en-id",
      value: "Sanguozhi",
      isPrimary: false,
      sortOrder: 0,
    },
  ]);
  assert.equal(result.undetermined, true);
});

test("planEntityNameBackfillRows: English primary + romanized → skip duplicate English", () => {
  const result = planEntityNameBackfillRows("tag", "t1", "Attack on Titan", "Attack on Titan", "en", IDS);
  assert.deepEqual(result.rows, [
    {
      ownerType: "tag",
      ownerId: "t1",
      languageId: "en-id",
      value: "Attack on Titan",
      isPrimary: true,
      sortOrder: 0,
    },
  ]);
  assert.equal(result.duplicateEnglish, true);
});

test("planEntityNameBackfillRows: detected ja but ja language id missing → no primary row", () => {
  const result = planEntityNameBackfillRows("bookmark", "b1", "進撃の巨人", null, "ja", {
    en: "en-id",
    ja: null,
    ko: null,
    zh: null,
  });
  assert.deepEqual(result.rows, []);
  assert.equal(result.undetermined, true);
});

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
