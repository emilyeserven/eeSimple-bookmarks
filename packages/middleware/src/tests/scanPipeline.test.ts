import assert from "node:assert/strict";
import { test } from "node:test";
import type { ScanPipelineDescription, ScanPipelineStage } from "@eesimple/types";
import { SCAN_PIPELINE_STAGE_IDS } from "@eesimple/types";
import type { ScanPipelineLiveState } from "@/services/scanPipeline";
import { buildScanPipelineReport } from "@/services/scanPipeline";
import { SCAN_PIPELINE_DESCRIPTION } from "@/services/scanPipelineDescription";
import { clearScanCache, getScanCacheStats, scanCacheKey, setCachedScan } from "@/services/scanCache";

/** Every stage in the description, in render order (top-level, lane, and branch stages). */
function allStages(description: ScanPipelineDescription): ScanPipelineStage[] {
  const stages: ScanPipelineStage[] = [];
  for (const node of description.nodes) {
    if (node.kind === "stage") stages.push(node.stage);
    if (node.kind === "parallel") {
      for (const lane of node.lanes) {
        stages.push(...lane.stages);
        for (const branch of lane.branchSet?.branches ?? []) stages.push(...branch.stages);
      }
    }
    if (node.kind === "branch") {
      for (const branch of node.branchSet.branches) stages.push(...branch.stages);
    }
  }
  return stages;
}

function findStage(description: ScanPipelineDescription, id: string): ScanPipelineStage {
  const stage = allStages(description).find(s => s.id === id);
  assert.ok(stage, `stage "${id}" not found in the description`);
  return stage;
}

function makeLiveState(overrides: Partial<ScanPipelineLiveState> = {}): ScanPipelineLiveState {
  return {
    connectors: {
      hostedMetadata: false,
      youtubeDataApi: false,
      kavita: false,
    },
    scanUrlForIsbnWebsiteCount: 0,
    redirectIgnoreListLength: 0,
    cache: {
      entries: 0,
      maxEntries: 500,
      ttlMs: 60_000,
    },
    ...overrides,
  };
}

// --- Descriptor invariants — these pin the descriptor to the /api/scan handler's actual shape. ---

test("descriptor stage ids match SCAN_PIPELINE_STAGE_IDS exactly (1:1, no dupes, no strays)", () => {
  const ids = allStages(SCAN_PIPELINE_DESCRIPTION).map(s => s.id);
  assert.deepEqual([...ids].sort(), [...SCAN_PIPELINE_STAGE_IDS].sort());
  assert.equal(new Set(ids).size, ids.length, "stage ids must be unique");
});

test("every id in the descriptor (lanes, branches, precedences, sources) is unique in its family", () => {
  const laneIds: string[] = [];
  const branchIds: string[] = [];
  const precedenceIds: string[] = [];
  for (const node of SCAN_PIPELINE_DESCRIPTION.nodes) {
    if (node.kind !== "parallel") continue;
    for (const lane of node.lanes) {
      laneIds.push(lane.id);
      for (const branch of lane.branchSet?.branches ?? []) branchIds.push(branch.id);
    }
  }
  for (const stage of allStages(SCAN_PIPELINE_DESCRIPTION)) {
    for (const precedence of stage.precedences ?? []) {
      precedenceIds.push(precedence.id);
      const sourceIds = precedence.sources.map(s => s.id);
      assert.equal(
        new Set(sourceIds).size,
        sourceIds.length,
        `duplicate source ids in precedence "${precedence.id}"`,
      );
    }
  }
  for (const [label, ids] of [["lane", laneIds], ["branch", branchIds], ["precedence", precedenceIds]] as const) {
    assert.equal(new Set(ids).size, ids.length, `duplicate ${label} ids`);
  }
});

test("the isbn-sources chain pins the exact ?? order of the /api/scan handler", () => {
  const stage = findStage(SCAN_PIPELINE_DESCRIPTION, "assemble-result");
  const chain = stage.precedences?.find(p => p.id === "isbn-sources");
  assert.ok(chain, "assemble-result must carry the isbn-sources chain");
  assert.equal(chain.mode, "first-non-null");
  // This order mirrors `isbnFromAsin ?? isbnFromAmazonPage ?? isbnFromHontoPage ?? isbnFromOreilly
  // ?? isbnFromGenericPage` in routes/metadata.ts — a reorder there must consciously update both.
  assert.deepEqual(chain.sources.map(s => s.id), [
    "isbn-from-asin",
    "isbn-from-amazon-page",
    "isbn-from-honto-page",
    "isbn-from-oreilly",
    "isbn-from-generic-page",
  ]);
});

test("the metadata-sources chain pins the scrape → oEmbed → hosted layering", () => {
  const stage = findStage(SCAN_PIPELINE_DESCRIPTION, "metadata-generic");
  const chain = stage.precedences?.find(p => p.id === "metadata-sources");
  assert.ok(chain);
  assert.equal(chain.mode, "layered-merge");
  assert.deepEqual(chain.sources.map(s => s.id), ["html-scrape", "oembed", "hosted-metadata"]);
});

test("the isbn-lookup-providers chain pins Open Library → Google Books → Kavita", () => {
  const stage = findStage(SCAN_PIPELINE_DESCRIPTION, "assemble-result");
  const chain = stage.precedences?.find(p => p.id === "isbn-lookup-providers");
  assert.ok(chain);
  assert.deepEqual(chain.sources.map(s => s.id), ["open-library", "google-books", "kavita-library"]);
});

// --- buildScanPipelineReport decoration ---

test("connector gates flip with live state (YouTube Data API off → on)", () => {
  const off = buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, makeLiveState());
  const offSource = findStage(off.description, "metadata-youtube")
    .precedences?.[0]?.sources.find(s => s.id === "youtube-data-api");
  assert.equal(offSource?.live?.state, "off");

  const on = buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, makeLiveState({
    connectors: {
      hostedMetadata: false,
      youtubeDataApi: true,
      kavita: false,
    },
  }));
  const onSource = findStage(on.description, "metadata-youtube")
    .precedences?.[0]?.sources.find(s => s.id === "youtube-data-api");
  assert.equal(onSource?.live?.state, "on");
});

test("websiteFlag gates read off with zero opted-in websites, conditional with a count", () => {
  const zero = buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, makeLiveState());
  assert.equal(findStage(zero.description, "isbn-from-url").live?.state, "off");

  const three = buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, makeLiveState({
    scanUrlForIsbnWebsiteCount: 3,
  }));
  const stage = findStage(three.description, "isbn-from-url");
  assert.equal(stage.live?.state, "conditional");
  assert.match(stage.live?.detail ?? "", /3 websites have/);
});

test("the resolve-redirect stage folds the ignore-list count into its live detail", () => {
  const report = buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, makeLiveState({
    redirectIgnoreListLength: 2,
  }));
  const stage = findStage(report.description, "resolve-redirect");
  assert.equal(stage.live?.state, "conditional");
  assert.match(stage.live?.detail ?? "", /2 domains are on the redirect ignore list/);
});

test("always gates decorate as on; every stage in the report carries live state", () => {
  const report = buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, makeLiveState());
  for (const stage of allStages(report.description)) {
    assert.ok(stage.live, `stage "${stage.id}" was not decorated`);
  }
  assert.equal(findStage(report.description, "validate-url").live?.state, "on");
});

test("buildScanPipelineReport never mutates the input description", () => {
  const before = structuredClone(SCAN_PIPELINE_DESCRIPTION);
  buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, makeLiveState({
    connectors: {
      hostedMetadata: true,
      youtubeDataApi: true,
      kavita: true,
    },
    scanUrlForIsbnWebsiteCount: 7,
  }));
  assert.deepEqual(SCAN_PIPELINE_DESCRIPTION, before);
});

test("the report carries cache stats, registries, and the supplied timestamp", () => {
  const now = new Date("2026-07-10T12:00:00.000Z");
  const report = buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, makeLiveState({
    cache: {
      entries: 4,
      maxEntries: 500,
      ttlMs: 60_000,
    },
  }), now);
  assert.equal(report.cache.entries, 4);
  assert.equal(report.generatedAt, "2026-07-10T12:00:00.000Z");
  assert.ok(report.registries.oembedProviders.some(p => p.name === "Vimeo"));
  assert.ok(report.registries.contentKinds.includes("youtube-video"));
  assert.equal(report.registries.isbnHtmlStrategies.length, 3);
});

// --- getScanCacheStats (side-effect-free live stats over the scan cache) ---

test("getScanCacheStats counts non-expired entries without evicting", () => {
  clearScanCache();
  try {
    const now = 1_000_000;
    const key = scanCacheKey("https://example.com/a", undefined, true);
    setCachedScan(key, {
      finalUrl: "https://example.com/a",
    } as never, now);

    assert.equal(getScanCacheStats(now).entries, 1);
    // Past the TTL the entry no longer counts — but the getter must not have evicted it either
    // (asking again at the original time still sees it).
    assert.equal(getScanCacheStats(now + 120_000).entries, 0);
    assert.equal(getScanCacheStats(now).entries, 1);

    const stats = getScanCacheStats(now);
    assert.equal(stats.maxEntries, 500);
    assert.equal(stats.ttlMs, 60_000);
  }
  finally {
    clearScanCache();
  }
});
