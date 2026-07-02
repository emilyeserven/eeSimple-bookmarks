import assert from "node:assert/strict";
import { test } from "node:test";
import { mapDatabaseTableDetail, mapDatabaseUsageRows } from "@/services/databaseUsage";

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

test("mapDatabaseTableDetail coerces sizes, computes TOAST as the remainder, and sorts indexes largest-first", () => {
  const detail = mapDatabaseTableDetail(
    "bookmarks",
    {
      heap_bytes: "100",
      index_bytes: "20",
      total_bytes: "150",
    },
    {
      n_live_tup: "42",
      n_dead_tup: "3",
      seq_scan: "5",
      idx_scan: "10",
      last_vacuum: "2026-06-20T00:00:00.000Z",
      last_autovacuum: null,
      last_analyze: null,
      last_autoanalyze: "2026-06-21T00:00:00.000Z",
    },
    [
      {
        column_name: "id",
        data_type: "uuid",
      },
      {
        column_name: "title",
        data_type: "text",
      },
    ],
    [
      {
        index_name: "bookmarks_small_idx",
        bytes: "5",
      },
      {
        index_name: "bookmarks_big_idx",
        bytes: "15",
      },
    ],
  );

  assert.equal(detail.heapBytes, 100);
  assert.equal(detail.indexBytes, 20);
  assert.equal(detail.toastBytes, 30);
  assert.equal(detail.totalBytes, 150);
  assert.equal(detail.rowEstimate, 42);
  assert.equal(detail.deadRowEstimate, 3);
  assert.equal(detail.sequentialScans, 5);
  assert.equal(detail.indexScans, 10);
  assert.equal(detail.lastVacuum, "2026-06-20T00:00:00.000Z");
  assert.equal(detail.lastAutoVacuum, null);
  assert.equal(detail.lastAnalyze, null);
  assert.equal(detail.lastAutoAnalyze, "2026-06-21T00:00:00.000Z");
  assert.deepEqual(detail.columns, [
    {
      columnName: "id",
      dataType: "uuid",
    },
    {
      columnName: "title",
      dataType: "text",
    },
  ]);
  assert.deepEqual(detail.indexes, [
    {
      indexName: "bookmarks_big_idx",
      bytes: 15,
    },
    {
      indexName: "bookmarks_small_idx",
      bytes: 5,
    },
  ]);
});

test("mapDatabaseTableDetail defaults stats to 0/null and clamps a negative TOAST remainder when there's no pg_stat_user_tables row yet", () => {
  const detail = mapDatabaseTableDetail(
    "brand_new_table",
    {
      heap_bytes: "100",
      index_bytes: "50",
      total_bytes: "120",
    },
    undefined,
    [],
    [],
  );

  assert.equal(detail.toastBytes, 0);
  assert.equal(detail.rowEstimate, 0);
  assert.equal(detail.deadRowEstimate, 0);
  assert.equal(detail.sequentialScans, 0);
  assert.equal(detail.indexScans, 0);
  assert.equal(detail.lastVacuum, null);
  assert.equal(detail.lastAutoVacuum, null);
  assert.equal(detail.lastAnalyze, null);
  assert.equal(detail.lastAutoAnalyze, null);
});
