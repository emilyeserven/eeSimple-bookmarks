/**
 * Shared shapes for the scan-pipeline description — the read-only, server-authored explanation of
 * how `GET /api/scan` processes a URL, surfaced on Settings → Advanced → Scan Pipeline.
 *
 * Only the *shapes* live here. The descriptor value itself (`SCAN_PIPELINE_DESCRIPTION`) is
 * deliberately authored in the middleware (`services/scanPipelineDescription.ts`), co-located with
 * the pipeline code it documents, and reaches the client only via `GET /api/scan-pipeline` — a
 * client must never import a static pipeline description directly, or it would silently drift from
 * the server's actual behavior.
 *
 * Every stage, lane, branch, and precedence source carries a **stable string id**. Those ids are
 * the forward-looking piece: a future user-defined-rules system (issue #1281) targets stages and
 * precedence sources by these ids, so renaming one is a breaking change (bump
 * `ScanPipelineDescription.version`).
 */

/**
 * Stable ids of every scan stage (including the two metadata branch stages), in pipeline order.
 * Derived as a tuple so tests can assert an exact 1:1 with the authored descriptor and a future
 * rules schema can build its target enum from it.
 */
export const SCAN_PIPELINE_STAGE_IDS = [
  "validate-url",
  "identity",
  "cache-lookup",
  "resolve-redirect",
  "website-lookup",
  "isbn-from-url",
  "duplicate-check",
  "metadata-youtube",
  "metadata-generic",
  "isbn-amazon-page",
  "isbn-honto-page",
  "isbn-generic-page",
  "assemble-result",
  "cache-store",
] as const;

/** A top-level scan stage id. Derived from {@link SCAN_PIPELINE_STAGE_IDS}. */
export type ScanPipelineStageId = typeof SCAN_PIPELINE_STAGE_IDS[number];

/**
 * The connector gates the scan pipeline can reference. Keys intentionally match the corresponding
 * `ConnectorsStatus` field names so the client can cross-link a gate to the Connectors settings tab.
 */
export const SCAN_PIPELINE_CONNECTOR_KEYS = [
  "hostedMetadata",
  "youtubeDataApi",
  "kavita",
] as const;

/** A connector key a pipeline gate can reference. Derived from {@link SCAN_PIPELINE_CONNECTOR_KEYS}. */
export type ScanPipelineConnectorKey = typeof SCAN_PIPELINE_CONNECTOR_KEYS[number];

/**
 * Why a stage (or precedence source) runs — or doesn't. Discriminated so each kind can be decorated
 * with live state differently. Compound gates (e.g. "website flag on AND Amazon product URL") are
 * expressed in the stage's `detail` prose, not a combinator type — v1 keeps the schema minimal.
 */
export type ScanPipelineGate
  /** Always runs. */
  = | { kind: "always" }
  /** Gated on a query parameter the client sends per scan (e.g. `resolveRedirect`). */
    | { kind: "queryParam";
      param: string;
      defaultValue: boolean; }
  /** Gated on an optional connector being configured (Tier 2 / keyed integrations). */
      | { kind: "connector";
        connector: ScanPipelineConnectorKey; }
  /** Gated on a per-website opt-in flag (currently only "Scan URL for ISBN"). */
        | { kind: "websiteFlag";
          flag: "scanUrlForIsbn"; }
  /** Runs only for URLs matching a shape the description names (e.g. "Amazon product URL"). */
          | { kind: "urlPattern";
            description: string; };

/**
 * Live state for one gate, computed by the server at request time. Absent on the static
 * descriptor; present on every gate in a `ScanPipelineReport`.
 */
export interface ScanPipelineGateLive {
  /** `on`/`off` for globally-resolvable gates; `conditional` when it depends on the scanned URL. */
  state: "on" | "off" | "conditional";
  /** Optional human-readable specifics, e.g. "3 websites have Scan URL for ISBN on". */
  detail?: string;
}

/** One source in an ordered precedence chain. */
export interface ScanPipelinePrecedenceSource {
  /** Stable id (future rule-target), e.g. "isbn-from-asin", "oembed", "hosted-metadata". */
  id: string;
  /** Human-readable label, e.g. "Amazon ASIN". */
  label: string;
  /** Optional one-line explanation of what this source contributes. */
  description?: string;
  /** Present when the source itself is gated (e.g. hosted metadata is connector-gated). */
  gate?: ScanPipelineGate;
  /** Live gate state, filled by the server; absent on the static descriptor. */
  live?: ScanPipelineGateLive;
}

/**
 * An ordered fallback/merge chain — the ISBN source `??` chain, the metadata source layering, the
 * ISBN lookup provider fallback. Array order is precedence order.
 */
export interface ScanPipelinePrecedence {
  /** Stable chain id (future rule-target), e.g. "isbn-sources". */
  id: string;
  /** Heading shown above the chain, e.g. "ISBN sources (first match wins)". */
  title: string;
  /**
   * How the chain combines its sources: `first-non-null` = the first source that yields a value
   * wins outright (a `??` chain); `layered-merge` = each source fills or overrides individual
   * fields, so later sources refine earlier ones rather than replacing them wholesale.
   */
  mode: "first-non-null" | "layered-merge";
  sources: ScanPipelinePrecedenceSource[];
}

/** The live data-driven registries a stage can reference; resolved into `ScanPipelineReport.registries`. */
export type ScanPipelineRegistryRef = "oembedProviders" | "contentKinds" | "isbnHtmlStrategies";

/** One step of the scan pipeline. */
export interface ScanPipelineStage {
  /**
   * Stable stage id. Top-level stages use {@link ScanPipelineStageId}; stages nested inside a
   * branch use their own stable string ids (kept open so a branch step doesn't need a tuple entry).
   */
  id: ScanPipelineStageId | string;
  /** Short display name, e.g. "Redirect resolution". */
  name: string;
  /** One-line summary shown when the stage row is collapsed. */
  summary: string;
  /** Longer prose shown when the row is expanded. */
  detail?: string;
  gate: ScanPipelineGate;
  /** Live gate state, filled by the server; absent on the static descriptor. */
  live?: ScanPipelineGateLive;
  /** The stage's ordered fallback/merge chains, when it has any (rendered in array order). */
  precedences?: ScanPipelinePrecedence[];
  /** Set when the stage consults one of the live registries (e.g. the oEmbed provider list). */
  registryRef?: ScanPipelineRegistryRef;
  /** Forward-looking hint that a future rules system could configure this stage. Render-only in v1. */
  configurable?: boolean;
}

/** Either/or alternatives filling one slot (the YouTube vs generic metadata branch). */
export interface ScanPipelineBranchSet {
  /** Stable id, e.g. "metadata-branch". */
  id: string;
  /** The condition that picks the branch, e.g. "URL is a YouTube video watch page". */
  chooser: string;
  branches: {
    id: string;
    label: string;
    stages: ScanPipelineStage[];
  }[];
}

/** One lane of a parallel fan-out. A lane is either a stage stack or a branch set. */
export interface ScanPipelineParallelLane {
  id: string;
  label: string;
  stages: ScanPipelineStage[];
  /** When present, the lane renders this branch set instead of a plain stage stack. */
  branchSet?: ScanPipelineBranchSet;
}

/**
 * A top-level pipeline node. Nodes render in order, top to bottom; a `parallel` node's lanes run
 * (and render) side by side.
 */
export type ScanPipelineNode
  = | { kind: "stage";
    stage: ScanPipelineStage; }
    | { kind: "parallel";
      id: string;
      label: string;
      lanes: ScanPipelineParallelLane[]; }
      | { kind: "branch";
        branchSet: ScanPipelineBranchSet; };

/** The whole pipeline description. Static when authored; live-decorated in a `ScanPipelineReport`. */
export interface ScanPipelineDescription {
  pipelineId: "scan";
  /** Bump when the descriptor's structure or any stable id changes (future stored rules key off ids). */
  version: number;
  /** The endpoint this description documents, e.g. "GET /api/scan". */
  endpoint: string;
  nodes: ScanPipelineNode[];
}

/** Live scan-cache stats (from the middleware's short-TTL in-memory scan cache). */
export interface ScanCacheStats {
  /** Non-expired entries currently cached. */
  entries: number;
  /** Hard cap on cached entries. */
  maxEntries: number;
  /** How long a cached scan stays fresh, in milliseconds. */
  ttlMs: number;
}

/** What `GET /api/scan-pipeline` returns: the live-decorated description plus registries + stats. */
export interface ScanPipelineReport {
  /** The pipeline description with `live` filled in on every gate. */
  description: ScanPipelineDescription;
  /** The data-driven registries the description references, resolved to serializable values. */
  registries: {
    /** The keyless oEmbed providers (names only — matchers/endpoints are functions). */
    oembedProviders: { name: string }[];
    /** The detectable content kinds, in detection-priority order. */
    contentKinds: string[];
    /** The generic ISBN HTML extractor's strategies, in the order they are tried. */
    isbnHtmlStrategies: string[];
  };
  cache: ScanCacheStats;
  /** ISO timestamp of when the report was generated. */
  generatedAt: string;
}
