/**
 * Scan-pipeline report assembly for `GET /api/scan-pipeline`: takes the static
 * `SCAN_PIPELINE_DESCRIPTION` and decorates every gate with live state (connector on/off, website
 * opt-in counts, cache stats). `buildScanPipelineReport` is pure so the decoration rules are
 * unit-testable without a database; the async gathering lives in `collectScanPipelineLiveState`.
 */

import type {
  ScanCacheStats,
  ScanPipelineBranchSet,
  ScanPipelineConnectorKey,
  ScanPipelineDescription,
  ScanPipelineGate,
  ScanPipelineGateLive,
  ScanPipelineNode,
  ScanPipelineReport,
  ScanPipelineStage,
} from "@eesimple/types";
import { BOOKMARK_CONTENT_KINDS, OEMBED_PROVIDERS } from "@eesimple/types";
import { getRedirectIgnoreList } from "@/services/appSettings";
import { hostedMetadataEnabledAsync } from "@/services/hostedMetadata";
import { kavitaEnabledAsync } from "@/services/kavita";
import { getScanCacheStats } from "@/services/scanCache";
import { countWebsitesWithScanUrlForIsbn } from "@/services/websites";
import { youtubeApiEnabledAsync } from "@/services/youtube";

/** Everything request-time-dependent that the report decoration needs, gathered in one object. */
export interface ScanPipelineLiveState {
  /** Whether each connector the pipeline references is configured. */
  connectors: Record<ScanPipelineConnectorKey, boolean>;
  /** How many websites have the "Scan URL for ISBN" flag on. */
  scanUrlForIsbnWebsiteCount: number;
  /** How many domains are on the redirect ignore list. */
  redirectIgnoreListLength: number;
  cache: ScanCacheStats;
}

/**
 * The live registries the description references, resolved to serializable values. Pure — the
 * registries are code-level constants (functions stripped: oEmbed matchers/endpoints don't serialize).
 */
export function resolveScanPipelineRegistries(): ScanPipelineReport["registries"] {
  return {
    oembedProviders: OEMBED_PROVIDERS.map(p => ({
      name: p.name,
    })),
    contentKinds: [...BOOKMARK_CONTENT_KINDS],
    // Mirrors the strategy order inside `extractIsbnFromHtml` (@eesimple/types isbnScrape.ts).
    isbnHtmlStrategies: [
      "JSON-LD isbn field",
      "ISBN-13 label in the page text",
      "ISBN-10 label in the page text (converted to ISBN-13)",
    ],
  };
}

/**
 * Gather everything request-time-dependent the report needs. All reads are existing, secrets-free
 * helpers — the same connector gates `routes/connectors.ts` reports, a website count, the redirect
 * ignore list length, and the scan cache's live stats. No writes, no bookmark-cache interaction.
 */
export async function collectScanPipelineLiveState(): Promise<ScanPipelineLiveState> {
  const [hostedMetadata, youtubeDataApi, kavita, scanUrlForIsbnWebsiteCount, redirectIgnoreList] = await Promise.all([
    hostedMetadataEnabledAsync(),
    youtubeApiEnabledAsync(),
    kavitaEnabledAsync(),
    countWebsitesWithScanUrlForIsbn(),
    getRedirectIgnoreList(),
  ]);
  return {
    connectors: {
      hostedMetadata,
      youtubeDataApi,
      kavita,
    },
    scanUrlForIsbnWebsiteCount,
    redirectIgnoreListLength: redirectIgnoreList.length,
    cache: getScanCacheStats(),
  };
}

/** Grammar helper for "N website(s) have/has" style live details. */
function countNoun(count: number, singular: string, plural: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

/** Compute the live state for one gate. Exhaustive over gate kinds — a new kind fails `tsc` here. */
function liveForGate(gate: ScanPipelineGate, live: ScanPipelineLiveState): ScanPipelineGateLive {
  switch (gate.kind) {
    case "always":
      return {
        state: "on",
      };
    case "queryParam":
      return {
        state: "conditional",
        detail: `The client decides per scan via the "${gate.param}" parameter (default ${gate.defaultValue ? "on" : "off"}).`,
      };
    case "connector":
      return live.connectors[gate.connector]
        ? {
          state: "on",
          detail: "Connector configured.",
        }
        : {
          state: "off",
          detail: "Connector not configured.",
        };
    case "websiteFlag": {
      const count = live.scanUrlForIsbnWebsiteCount;
      return count > 0
        ? {
          state: "conditional",
          detail: `${countNoun(count, "website has", "websites have")} "Scan URL for ISBN" on.`,
        }
        : {
          state: "off",
          detail: "No website has \"Scan URL for ISBN\" on.",
        };
    }
    case "urlPattern":
      return {
        state: "conditional",
        detail: `Only for: ${gate.description}.`,
      };
    default: {
      const exhaustive: never = gate;
      throw new Error(`Unhandled gate kind: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Extra per-stage live detail appended after the gate-derived detail. Keyed by stage id so the
 * decoration stays data-driven rather than string surgery on gate text.
 */
const STAGE_LIVE_DETAILS: Partial<Record<string, (live: ScanPipelineLiveState) => string>> = {
  "resolve-redirect": live =>
    `${countNoun(live.redirectIgnoreListLength, "domain is", "domains are")} on the redirect ignore list.`,
};

/** Decorate one stage in place (the caller passes a deep copy): gate live + precedence-source lives. */
function decorateStage(stage: ScanPipelineStage, live: ScanPipelineLiveState): void {
  const gateLive = liveForGate(stage.gate, live);
  const extra = STAGE_LIVE_DETAILS[stage.id]?.(live);
  stage.live = extra
    ? {
      ...gateLive,
      detail: [gateLive.detail, extra].filter(Boolean).join(" "),
    }
    : gateLive;
  for (const precedence of stage.precedences ?? []) {
    for (const source of precedence.sources) {
      if (source.gate) source.live = liveForGate(source.gate, live);
    }
  }
}

function decorateBranchSet(branchSet: ScanPipelineBranchSet, live: ScanPipelineLiveState): void {
  for (const branch of branchSet.branches) {
    for (const stage of branch.stages) decorateStage(stage, live);
  }
}

function decorateNode(node: ScanPipelineNode, live: ScanPipelineLiveState): void {
  switch (node.kind) {
    case "stage":
      decorateStage(node.stage, live);
      break;
    case "parallel":
      for (const lane of node.lanes) {
        for (const stage of lane.stages) decorateStage(stage, live);
        if (lane.branchSet) decorateBranchSet(lane.branchSet, live);
      }
      break;
    case "branch":
      decorateBranchSet(node.branchSet, live);
      break;
  }
}

/**
 * Build the full report from the static description + gathered live state. Pure: the input
 * description is deep-copied, never mutated, so the module-level descriptor stays pristine.
 */
export function buildScanPipelineReport(
  description: ScanPipelineDescription,
  live: ScanPipelineLiveState,
  now: Date = new Date(),
): ScanPipelineReport {
  const decorated = structuredClone(description);
  for (const node of decorated.nodes) decorateNode(node, live);
  return {
    description: decorated,
    registries: resolveScanPipelineRegistries(),
    cache: live.cache,
    generatedAt: now.toISOString(),
  };
}
