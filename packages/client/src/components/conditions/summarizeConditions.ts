import type { ConditionTree } from "@eesimple/types";

import i18n from "@/i18n";

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
  /** Number of selected Genres & Moods ids (a single genre-mood leaf can hold several). */
  genreMoods: number;
  /** Number of selected relationship type ids (a single relationship-type leaf can hold several). */
  relationshipTypes: number;
  /** Number of language-usage leaves in the tree. */
  languageUsages: number;
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
  let genreMoods = 0;
  let relationshipTypes = 0;
  let languageUsages = 0;
  let properties = 0;
  for (const child of tree.children) {
    if (child.type === "match") match += 1;
    else if (child.type === "category") categories += child.categoryIds.length;
    else if (child.type === "website") websites += child.domains.length;
    else if (child.type === "tag") tags += child.tagIds.length;
    else if (child.type === "location") locations += child.locationIds.length;
    else if (child.type === "youtube-channel") channels += child.channelIds.length;
    else if (child.type === "media-type") mediaTypes += child.mediaTypeIds.length;
    else if (child.type === "genre-mood") genreMoods += child.genreMoodIds.length;
    else if (child.type === "relationship-type") relationshipTypes += child.relationshipTypeIds.length;
    else if (child.type === "language-usage") languageUsages += 1;
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
    genreMoods,
    relationshipTypes,
    languageUsages,
    properties,
    combinator: tree.combinator,
  };
}

/** One-line headline for a filter, e.g. `"3 filter conditions (AND)"`. */
export function conditionsSummaryLabel(tree: ConditionTree): string {
  const total = tree.children.length;
  if (total === 0) return i18n.t("No filter conditions — shows nothing");
  return total === 1
    ? i18n.t("{{count}} filter condition ({{combinator}})", {
      count: total,
      combinator: tree.combinator.toUpperCase(),
    })
    : i18n.t("{{count}} filter conditions ({{combinator}})", {
      count: total,
      combinator: tree.combinator.toUpperCase(),
    });
}

/**
 * One-line per-type breakdown label, e.g. `"2 title matches · 3 categories"`.
 * Falls back to `"No conditions set"` for an empty tree.
 * Matches the Autofill-style collapsed preview.
 */
export function conditionsDetailedLabel(tree: ConditionTree): string {
  const parts = conditionsBreakdown(tree);
  return parts.length > 0 ? parts.join(" · ") : i18n.t("No conditions set");
}

/** Per-type breakdown rows: the summary count paired with its singular/plural noun. */
const BREAKDOWN_LABELS: {
  key: keyof Omit<ConditionSummary, "total" | "combinator">;
  singular: string;
  plural: string;
}[] = [
  {
    key: "match",
    singular: "title match",
    plural: "title matches",
  },
  {
    key: "categories",
    singular: "category",
    plural: "categories",
  },
  {
    key: "websites",
    singular: "website",
    plural: "websites",
  },
  {
    key: "tags",
    singular: "tag",
    plural: "tags",
  },
  {
    key: "locations",
    singular: "location",
    plural: "locations",
  },
  {
    key: "channels",
    singular: "YouTube channel",
    plural: "YouTube channels",
  },
  {
    key: "mediaTypes",
    singular: "media type",
    plural: "media types",
  },
  {
    key: "genreMoods",
    singular: "Genres & Moods entry",
    plural: "Genres & Moods entries",
  },
  {
    key: "relationshipTypes",
    singular: "relationship type",
    plural: "relationship types",
  },
  {
    key: "languageUsages",
    singular: "language usage",
    plural: "language usages",
  },
  {
    key: "properties",
    singular: "custom property",
    plural: "custom properties",
  },
];

/** Human-readable per-type breakdown lines (only non-empty types), e.g. `["2 match", "3 categories"]`. */
export function conditionsBreakdown(tree: ConditionTree): string[] {
  const summary = summarizeConditions(tree);
  return BREAKDOWN_LABELS
    .map(({
      key, singular, plural,
    }) => ({
      count: summary[key],
      singular,
      plural,
    }))
    .filter(({
      count,
    }) => count > 0)
    .map(({
      count, singular, plural,
    }) => `${count} ${i18n.t(count === 1 ? singular : plural)}`);
}
