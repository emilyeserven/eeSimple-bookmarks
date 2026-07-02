import type {
  CategoryCondition,
  ConditionNode,
  ConditionTree,
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
  relationshipTypeLeaf: RelationshipTypeCondition | undefined;
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
    relationshipType: number;
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
  relationshipType?: RelationshipTypeCondition | null;
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
  const relationshipTypeLeaf = value.children.find((child): child is RelationshipTypeCondition => child.type === "relationship-type");
  return {
    matches: value.children.filter((child): child is MatchCondition => child.type === "match"),
    categoryLeaf,
    websiteLeaf,
    tagLeaf,
    locationLeaf,
    youtubeChannelLeaf,
    mediaTypeLeaf,
    relationshipTypeLeaf,
    propertyLeaves: value.children.filter((child): child is PropertyCondition => child.type === "property"),
    nestedGroups: value.children.filter(child => child.type === "group"),
    counts: {
      category: categoryLeaf?.categoryIds.length ?? 0,
      website: websiteLeaf?.domains.length ?? 0,
      tag: tagLeaf?.tagIds.length ?? 0,
      location: locationLeaf?.locationIds.length ?? 0,
      youtubeChannel: youtubeChannelLeaf?.channelIds.length ?? 0,
      mediaType: mediaTypeLeaf?.mediaTypeIds.length ?? 0,
      relationshipType: relationshipTypeLeaf?.relationshipTypeIds.length ?? 0,
    },
  };
}

/**
 * Rebuild the root group's children from the current leaves and a patch. Empty selections drop
 * their leaf from the tree entirely; nested groups always round-trip untouched.
 */
export function buildRootChildren(
  current: RootConditionLeaves,
  next: RootConditionPatch,
): ConditionNode[] {
  const nextMatches = next.matches ?? current.matches;
  const nextCategory = next.category === undefined ? current.categoryLeaf : next.category;
  const nextWebsite = next.website === undefined ? current.websiteLeaf : next.website;
  const nextTag = next.tag === undefined ? current.tagLeaf : next.tag;
  const nextLocation = next.location === undefined ? current.locationLeaf : next.location;
  const nextYoutubeChannel = next.youtubeChannel === undefined ? current.youtubeChannelLeaf : next.youtubeChannel;
  const nextMediaType = next.mediaType === undefined ? current.mediaTypeLeaf : next.mediaType;
  const nextRelationshipType = next.relationshipType === undefined ? current.relationshipTypeLeaf : next.relationshipType;
  const nextProperties = next.properties ?? current.propertyLeaves;
  return [
    ...nextMatches,
    ...(nextCategory && nextCategory.categoryIds.length > 0 ? [nextCategory] : []),
    ...(nextWebsite && nextWebsite.domains.length > 0 ? [nextWebsite] : []),
    ...(nextTag && nextTag.tagIds.length > 0 ? [nextTag] : []),
    ...(nextLocation && nextLocation.locationIds.length > 0 ? [nextLocation] : []),
    ...(nextYoutubeChannel && nextYoutubeChannel.channelIds.length > 0 ? [nextYoutubeChannel] : []),
    ...(nextMediaType && nextMediaType.mediaTypeIds.length > 0 ? [nextMediaType] : []),
    ...(nextRelationshipType && nextRelationshipType.relationshipTypeIds.length > 0 ? [nextRelationshipType] : []),
    ...nextProperties,
    ...current.nestedGroups,
  ];
}
