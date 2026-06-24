import type { BulkBookmarkResult, BulkDeleteResult } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { summarizeBulk } from "./bulkResults";

describe("summarizeBulk", () => {
  it("counts applied/deleted items under the given verb", () => {
    const results: BulkBookmarkResult[] = [
      {
        id: "1",
        status: "applied",
      },
      {
        id: "2",
        status: "applied",
      },
    ];
    expect(summarizeBulk(results, "updated")).toBe("2 updated");
  });

  it("appends skipped, not-found, and failed breakdowns", () => {
    const results: BulkDeleteResult[] = [
      {
        id: "1",
        status: "deleted",
      },
      {
        id: "2",
        status: "skipped-built-in",
      },
      {
        id: "3",
        status: "not-found",
      },
      {
        id: "4",
        status: "error",
      },
    ];
    expect(summarizeBulk(results, "deleted")).toBe(
      "1 deleted, 1 skipped (built-in), 1 not found, 1 failed",
    );
  });

  it("reports zero successes when everything failed", () => {
    const results: BulkBookmarkResult[] = [{
      id: "1",
      status: "error",
    }];
    expect(summarizeBulk(results, "updated")).toBe("0 updated, 1 failed");
  });
});
