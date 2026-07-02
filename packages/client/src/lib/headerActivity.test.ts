// @vitest-environment node
import type { ActiveImport, ActiveReelArchiveJob, AutoFetchJobStatus } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { fetchRow, importRow, reelRow } from "./headerActivity";

function makeImport(overrides: Partial<ActiveImport> = {}): ActiveImport {
  return {
    id: "imp-1",
    source: "url",
    sourceLabel: "Example newsletter",
    status: "processing",
    totalCount: 10,
    processedCount: 4,
    ...overrides,
  };
}

describe("importRow", () => {
  it("reports processed/total with a fraction while processing", () => {
    expect(importRow(makeImport())).toEqual({
      key: "imp-1",
      label: "Example newsletter",
      detail: "4 / 10",
      fraction: 0.4,
    });
  });

  it("shows Queued… with a 0 fraction before extraction finishes", () => {
    const row = importRow(makeImport({
      status: "queued",
      totalCount: null,
      processedCount: null,
    }));
    expect(row.detail).toBe("Queued…");
    expect(row.fraction).toBe(0);
  });

  it("falls back to 'Import' when the source label is missing", () => {
    expect(importRow(makeImport({
      sourceLabel: null,
    })).label).toBe("Import");
  });

  it("caps the fraction at 1", () => {
    expect(importRow(makeImport({
      totalCount: 5,
      processedCount: 8,
    })).fraction).toBe(1);
  });
});

describe("reelRow", () => {
  function makeReel(status: ActiveReelArchiveJob["status"]): ActiveReelArchiveJob {
    return {
      id: "reel-1",
      bookmarkId: "bm-1",
      bookmarkTitle: "My reel",
      status,
    };
  }

  it("has no progress bar (null fraction) and a status detail", () => {
    expect(reelRow(makeReel("queued"))).toEqual({
      key: "reel-1",
      label: "My reel",
      detail: "Queued…",
      fraction: null,
    });
    expect(reelRow(makeReel("processing")).detail).toBe("Archiving…");
  });
});

describe("fetchRow", () => {
  it("returns null unless the job is running", () => {
    expect(fetchRow("k", "Label", undefined)).toBeNull();
    expect(fetchRow("k", "Label", {
      status: "idle",
    } as AutoFetchJobStatus)).toBeNull();
    expect(fetchRow("k", "Label", {
      status: "done",
      fetched: 3,
      failed: 0,
    })).toBeNull();
  });

  it("builds a row with processed/total and a fraction while running", () => {
    expect(fetchRow("missing", "Fetching missing images", {
      status: "running",
      totalCount: 8,
      processedCount: 2,
    })).toEqual({
      key: "missing",
      label: "Fetching missing images",
      detail: "2 / 8",
      fraction: 0.25,
    });
  });

  it("shows an ellipsis and 0 fraction before the total is known", () => {
    const row = fetchRow("missing", "Fetching missing images", {
      status: "running",
      totalCount: 0,
      processedCount: 0,
    });
    expect(row).toMatchObject({
      detail: "…",
      fraction: 0,
    });
  });
});
