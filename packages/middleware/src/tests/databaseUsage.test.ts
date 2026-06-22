import assert from "node:assert/strict";
import { test } from "node:test";
import { mapDatabaseUsageRows } from "@/services/databaseUsage";

test("mapDatabaseUsageRows coerces string bigint columns to numbers", () => {
  const report = mapDatabaseUsageRows(
    [{
      table_name: "bookmarks",
      total_bytes: "131072",
      row_estimate: "42",
    }],
    {
      total_bytes: "262144",
    },
    "2026-06-22T00:00:00.000Z",
  );
  assert.deepEqual(report.tables, [
    {
      tableName: "bookmarks",
      totalBytes: 131072,
      rowEstimate: 42,
    },
  ]);
  assert.equal(report.totalBytes, 262144);
  assert.equal(report.capturedAt, "2026-06-22T00:00:00.000Z");
});

test("mapDatabaseUsageRows clamps a never-analyzed reltuples estimate (-1) up to 0", () => {
  const report = mapDatabaseUsageRows(
    [{
      table_name: "tags",
      total_bytes: "8192",
      row_estimate: "-1",
    }],
    {
      total_bytes: "8192",
    },
    "2026-06-22T00:00:00.000Z",
  );
  assert.equal(report.tables[0].rowEstimate, 0);
});

test("mapDatabaseUsageRows rounds fractional row estimates and tolerates a missing total row", () => {
  const report = mapDatabaseUsageRows(
    [{
      table_name: "websites",
      total_bytes: 16384,
      row_estimate: 12.6,
    }],
    undefined,
    "2026-06-22T00:00:00.000Z",
  );
  assert.equal(report.tables[0].rowEstimate, 13);
  assert.equal(report.totalBytes, 0);
});

test("mapDatabaseUsageRows defaults non-numeric values to 0", () => {
  const report = mapDatabaseUsageRows(
    [{
      table_name: "weird",
      total_bytes: "NaN",
      row_estimate: "oops",
    }],
    {
      total_bytes: "also-bad",
    },
    "2026-06-22T00:00:00.000Z",
  );
  assert.equal(report.tables[0].totalBytes, 0);
  assert.equal(report.tables[0].rowEstimate, 0);
  assert.equal(report.totalBytes, 0);
});
