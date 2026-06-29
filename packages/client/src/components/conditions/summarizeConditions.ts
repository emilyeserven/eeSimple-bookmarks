import type { ConditionTree } from "@eesimple/types";

/** Per-type counts for a condition tree's direct leaves, used to render filter previews. */
export interface ConditionSummary {
  /** Number of direct child leaves (matches the headline "N filter conditions"). */
  total: number;
  match: number;
  /** Number of selected category ids (a single category leaf can hold several). */
  categories: number;
  /** Number of selected website domains (a single website leaf can hold several). */
  websites: number;
  /** Number of selected tag ids (a single tag leaf can hold several). */
  tags: number;
  /** Number of selected location ids (a single location leaf can hold several). */
  locations: number;
  /** Number of selected YouTube channel ids (a single youtube-channel leaf can hold several). */
  channels: number;
  /** Number of selected media type ids (a single media-type leaf can hold several). */
  mediaTypes: number;
  /** Number of selected relationship type ids (a single relationship-type leaf can hold several). */
  relationshipTypes: number;
  properties: number;
  combinator: "and" | "or";
}

/** Summarize a condition tree's direct children into per-type counts. */
export function summarizeConditions(tree: ConditionTree): ConditionSummary {
  let match = 0;
  let categories = 0;
  let websites = 0;
  let tags = 0;
  let locations = 0;
  let channels = 0;
  let mediaTypes = 0;
  let relationshipTypes = 0;
  let properties = 0;
  for (const child of tree.children) {
    if (child.type === "match") match += 1;
    else if (child.type === "category") categories += child.categoryIds.length;
    else if (child.type === "website") websites += child.domains.length;
    else if (child.type === "tag") tags += child.tagIds.length;
    else if (child.type === "location") locations += child.locationIds.length;
    else if (child.type === "youtube-channel") channels += child.channelIds.length;
    else if (child.type === "media-type") mediaTypes += child.mediaTypeIds.length;
    else if (child.type === "relationship-type") relationshipTypes += child.relationshipTypeIds.length;
    else if (child.type === "property") properties += 1;
  }
  return {
    total: tree.children.length,
    match,
    categories,
    websites,
    tags,
    locations,
    channels,
    mediaTypes,
    relationshipTypes,
    properties,
    combinator: tree.combinator,
  };
}

/** One-line headline for a filter, e.g. `"3 filter conditions (AND)"`. */
export function conditionsSummaryLabel(tree: ConditionTree): string {
  const total = tree.children.length;
  if (total === 0) return "No filter conditions — shows nothing";
  return `${total} filter condition${total === 1 ? "" : "s"} (${tree.combinator.toUpperCase()})`;
}

/**
 * One-line per-type breakdown label, e.g. `"2 title matches · 3 categories"`.
 * Falls back to `"No conditions set"` for an empty tree.
 * Matches the Autofill-style collapsed preview.
 */
export function conditionsDetailedLabel(tree: ConditionTree): string {
  const parts = conditionsBreakdown(tree);
  return parts.length > 0 ? parts.join(" · ") : "No conditions set";
}

/** Human-readable per-type breakdown lines (only non-empty types), e.g. `["2 match", "3 categories"]`. */
export function conditionsBreakdown(tree: ConditionTree): string[] {
  const summary = summarizeConditions(tree);
  const lines: string[] = [];
  if (summary.match > 0) lines.push(`${summary.match} title match${summary.match === 1 ? "" : "es"}`);
  if (summary.categories > 0) lines.push(`${summary.categories} categor${summary.categories === 1 ? "y" : "ies"}`);
  if (summary.websites > 0) lines.push(`${summary.websites} website${summary.websites === 1 ? "" : "s"}`);
  if (summary.tags > 0) lines.push(`${summary.tags} tag${summary.tags === 1 ? "" : "s"}`);
  if (summary.locations > 0) lines.push(`${summary.locations} location${summary.locations === 1 ? "" : "s"}`);
  if (summary.channels > 0) lines.push(`${summary.channels} YouTube channel${summary.channels === 1 ? "" : "s"}`);
  if (summary.mediaTypes > 0) lines.push(`${summary.mediaTypes} media type${summary.mediaTypes === 1 ? "" : "s"}`);
  if (summary.relationshipTypes > 0) lines.push(`${summary.relationshipTypes} relationship type${summary.relationshipTypes === 1 ? "" : "s"}`);
  if (summary.properties > 0) lines.push(`${summary.properties} custom propert${summary.properties === 1 ? "y" : "ies"}`);
  return lines;
}
