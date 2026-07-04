import type {
  CategoryCondition,
  ConditionNode,
  ConditionTree,
  GenreMoodCondition,
  LanguageUsageCondition,
  LocationCondition,
  MatchCondition,
  MediaTypeCondition,
  PropertyCondition,
  RelationshipTypeCondition,
  TagCondition,
  WebsiteCondition,
  YouTubeChannelCondition,
} from "@eesimple/types";

/** The root condition group split into the per-section leaves the builder UI edits. */
export interface RootConditionLeaves {
  matches: MatchCondition[];
  categoryLeaf: CategoryCondition | undefined;
  websiteLeaf: WebsiteCondition | undefined;
  tagLeaf: TagCondition | undefined;
  locationLeaf: LocationCondition | undefined;
  youtubeChannelLeaf: YouTubeChannelCondition | undefined;
  mediaTypeLeaf: MediaTypeCondition | undefined;
  genreMoodLeaf: GenreMoodCondition | undefined;
  relationshipTypeLeaf: RelationshipTypeCondition | undefined;
  languageUsageLeaf: LanguageUsageCondition | undefined;
  propertyLeaves: PropertyCondition[];
  /** Nested groups (not editable in this v1 UI), preserved so the tree round-trips. */
  nestedGroups: ConditionNode[];
  /** Per-section selection counts, used for the section summaries / default-open state. */
  counts: {
    category: number;
    website: number;
    tag: number;
    location: number;
    youtubeChannel: number;
    mediaType: number;
    genreMood: number;
    relationshipType: number;
    languageUsage: number;
  };
}

/** A partial replacement for the root leaves: `undefined` keeps the current leaf, `null` clears it. */
export interface RootConditionPatch {
  matches?: MatchCondition[];
  category?: CategoryCondition | null;
  website?: WebsiteCondition | null;
  tag?: TagCondition | null;
  location?: LocationCondition | null;
  youtubeChannel?: YouTubeChannelCondition | null;
  mediaType?: MediaTypeCondition | null;
  genreMood?: GenreMoodCondition | null;
  relationshipType?: RelationshipTypeCondition | null;
  languageUsage?: LanguageUsageCondition | null;
  properties?: PropertyCondition[];
}

/** Split the root group's children into the per-section leaves (plus their selection counts). */
export function splitRootConditions(value: ConditionTree): RootConditionLeaves {
  const categoryLeaf = value.children.find((child): child is CategoryCondition => child.type === "category");
  const websiteLeaf = value.children.find((child): child is WebsiteCondition => child.type === "website");
  const tagLeaf = value.children.find((child): child is TagCondition => child.type === "tag");
  const locationLeaf = value.children.find((child): child is LocationCondition => child.type === "location");
  const youtubeChannelLeaf = value.children.find((child): child is YouTubeChannelCondition => child.type === "youtube-channel");
  const mediaTypeLeaf = value.children.find((child): child is MediaTypeCondition => child.type === "media-type");
  const genreMoodLeaf = value.children.find((child): child is GenreMoodCondition => child.type === "genre-mood");
  const relationshipTypeLeaf = value.children.find((child): child is RelationshipTypeCondition => child.type === "relationship-type");
  const languageUsageLeaf = value.children.find((child): child is LanguageUsageCondition => child.type === "language-usage");
  return {
    matches: value.children.filter((child): child is MatchCondition => child.type === "match"),
    categoryLeaf,
    websiteLeaf,
    tagLeaf,
    locationLeaf,
    youtubeChannelLeaf,
    mediaTypeLeaf,
    genreMoodLeaf,
    relationshipTypeLeaf,
    languageUsageLeaf,
    propertyLeaves: value.children.filter((child): child is PropertyCondition => child.type === "property"),
    nestedGroups: value.children.filter(child => child.type === "group"),
    counts: {
      category: categoryLeaf?.categoryIds.length ?? 0,
      website: websiteLeaf?.domains.length ?? 0,
      tag: tagLeaf?.tagIds.length ?? 0,
      location: locationLeaf?.locationIds.length ?? 0,
      youtubeChannel: youtubeChannelLeaf?.channelIds.length ?? 0,
      mediaType: mediaTypeLeaf?.mediaTypeIds.length ?? 0,
      genreMood: genreMoodLeaf?.genreMoodIds.length ?? 0,
      relationshipType: relationshipTypeLeaf?.relationshipTypeIds.length ?? 0,
      languageUsage: (languageUsageLeaf?.languageIds.length ?? 0) + (languageUsageLeaf?.usageLevelIds.length ?? 0),
    },
  };
}

/**
 * Resolve one single-leaf section for the rebuilt tree: `undefined` in the patch keeps the current
 * leaf, `null` clears it, and a leaf with an empty selection (per `isNonEmpty`) is dropped entirely.
 * Returns a 0-or-1-element array so callers can spread it into the children list.
 */
function resolveLeaf<T>(
  patchValue: T | null | undefined,
  currentLeaf: T | undefined,
  isNonEmpty: (leaf: T) => boolean,
): T[] {
  const nextLeaf = patchValue === undefined ? currentLeaf : patchValue;
  return nextLeaf && isNonEmpty(nextLeaf) ? [nextLeaf] : [];
}

/**
 * Rebuild the root group's children from the current leaves and a patch. Empty selections drop
 * their leaf from the tree entirely; nested groups always round-trip untouched.
 */
export function buildRootChildren(
  current: RootConditionLeaves,
  next: RootConditionPatch,
): ConditionNode[] {
  return [
    ...(next.matches ?? current.matches),
    ...resolveLeaf(next.category, current.categoryLeaf, leaf => leaf.categoryIds.length > 0),
    ...resolveLeaf(next.website, current.websiteLeaf, leaf => leaf.domains.length > 0),
    ...resolveLeaf(next.tag, current.tagLeaf, leaf => leaf.tagIds.length > 0),
    ...resolveLeaf(next.location, current.locationLeaf, leaf => leaf.locationIds.length > 0),
    ...resolveLeaf(next.youtubeChannel, current.youtubeChannelLeaf, leaf => leaf.channelIds.length > 0),
    ...resolveLeaf(next.mediaType, current.mediaTypeLeaf, leaf => leaf.mediaTypeIds.length > 0),
    ...resolveLeaf(next.genreMood, current.genreMoodLeaf, leaf => leaf.genreMoodIds.length > 0),
    ...resolveLeaf(next.relationshipType, current.relationshipTypeLeaf, leaf => leaf.relationshipTypeIds.length > 0),
    ...resolveLeaf(
      next.languageUsage,
      current.languageUsageLeaf,
      leaf => leaf.languageIds.length > 0 || leaf.usageLevelIds.length > 0,
    ),
    ...(next.properties ?? current.propertyLeaves),
    ...current.nestedGroups,
  ];
}
