/**
 * Pure planning helpers for the merge-bookmarks review dialog: which scalar "units" differ among a
 * duplicate group's members (a unit is one picker row — single fields, plus multi-field units like
 * the Kavita/Plex link triples that are picked together), the per-member display values, the wire
 * `fieldChoices` built from the picks, and the informational association-union summary.
 */

import type { Bookmark, MergeScalarField } from "@eesimple/types";

export interface MergeFieldUnit {
  key: string;
  /** English phrase — translate with `t()` at render. */
  label: string;
  fields: readonly MergeScalarField[];
}

/** Every MERGE_SCALAR_FIELDS member appears in exactly one unit (asserted by mergePlanner.test.ts). */
export const MERGE_FIELD_UNITS: readonly MergeFieldUnit[] = [
  {
    key: "url",
    label: "URL",
    fields: ["url"],
  },
  {
    key: "originalUrl",
    label: "Original URL",
    fields: ["originalUrl"],
  },
  {
    key: "secondaryUrl",
    label: "Download URL",
    fields: ["secondaryUrl"],
  },
  {
    key: "title",
    label: "Title",
    fields: ["title"],
  },
  {
    key: "description",
    label: "Description",
    fields: ["description"],
  },
  {
    key: "priority",
    label: "Priority",
    fields: ["priority"],
  },
  {
    key: "imageDisplayPreference",
    label: "Cover display",
    fields: ["imageDisplayPreference"],
  },
  {
    key: "categoryId",
    label: "Category",
    fields: ["categoryId"],
  },
  {
    key: "websiteId",
    label: "Website",
    fields: ["websiteId"],
  },
  {
    key: "mediaTypeId",
    label: "Media type",
    fields: ["mediaTypeId"],
  },
  {
    key: "youtubeChannelId",
    label: "YouTube channel",
    fields: ["youtubeChannelId"],
  },
  {
    key: "newsletterId",
    label: "Newsletter",
    fields: ["newsletterId"],
  },
  {
    key: "importId",
    label: "Import",
    fields: ["importId"],
  },
  {
    key: "kavita",
    label: "Kavita link",
    fields: ["kavitaSeriesId", "kavitaLibraryId", "kavitaSeriesName"],
  },
  {
    key: "plex",
    label: "Plex link",
    fields: ["plexRatingKey", "plexItemType", "plexItemTitle"],
  },
  {
    key: "isbn",
    label: "ISBN",
    fields: ["isbn"],
  },
  {
    key: "year",
    label: "Year",
    fields: ["year"],
  },
  {
    key: "wikidataId",
    label: "Wikidata",
    fields: ["wikidataId"],
  },
  {
    key: "wikipedia",
    label: "Wikipedia links",
    fields: ["wikipediaLinkEn", "wikipediaLinkLocal"],
  },
  {
    key: "feedUrl",
    label: "Feed URL",
    fields: ["feedUrl"],
  },
  {
    key: "itunes",
    label: "Apple Podcasts",
    fields: ["itunesId", "itunesUrl"],
  },
  {
    key: "spotifyUrl",
    label: "Spotify",
    fields: ["spotifyUrl"],
  },
  {
    key: "pocketCasts",
    label: "Pocket Casts",
    fields: ["pocketCastsUuid", "pocketCastsUrl"],
  },
  {
    key: "defaultLinkProvider",
    label: "Default link provider",
    fields: ["defaultLinkProvider"],
  },
];

/** FK fields live as embedded relations on the hydrated `Bookmark`; map them back to the row id. */
const FK_ID_ACCESSORS: Partial<Record<MergeScalarField, (bookmark: Bookmark) => string | null>> = {
  websiteId: bookmark => bookmark.website?.id ?? null,
  mediaTypeId: bookmark => bookmark.mediaType?.id ?? null,
  youtubeChannelId: bookmark => bookmark.youtubeChannel?.id ?? null,
  newsletterId: bookmark => bookmark.newsletter?.id ?? null,
  importId: bookmark => bookmark.import?.id ?? null,
};

/** The wire-level value of a scalar field on a hydrated bookmark (what the merge would copy). */
export function mergeFieldValue(bookmark: Bookmark, field: MergeScalarField): string | number | null {
  const fkAccessor = FK_ID_ACCESSORS[field];
  if (fkAccessor) return fkAccessor(bookmark);
  return (bookmark as unknown as Record<string, string | number | null>)[field] ?? null;
}

/** Human-readable display for FK fields; everything else shows its raw value. */
const DISPLAY_ACCESSORS: Partial<Record<MergeScalarField, (bookmark: Bookmark) => string | null>> = {
  websiteId: bookmark => bookmark.website?.siteName ?? null,
  mediaTypeId: bookmark => bookmark.mediaType?.name ?? null,
  youtubeChannelId: bookmark => bookmark.youtubeChannel?.name ?? null,
  newsletterId: bookmark => bookmark.newsletter?.name ?? null,
  importId: bookmark => bookmark.import?.title ?? bookmark.import?.id ?? null,
};

/** Units on which the members disagree — the only rows the review dialog shows. */
export function differingUnits(members: Bookmark[]): MergeFieldUnit[] {
  const [first, ...rest] = members;
  if (first === undefined) return [];
  return MERGE_FIELD_UNITS.filter(unit => unit.fields.some((field) => {
    const firstValue = mergeFieldValue(first, field);
    return rest.some(member => mergeFieldValue(member, field) !== firstValue);
  }));
}

/**
 * One member's display string for a unit: the distinct non-empty field displays joined with " · ",
 * or `null` when the member has no value (rendered as an em dash). `resolveCategoryName` maps the
 * category id (the one FK not embedded on `Bookmark`) to its name.
 */
export function unitDisplayValue(
  member: Bookmark,
  unit: MergeFieldUnit,
  resolveCategoryName?: (id: string) => string | null,
): string | null {
  const parts: string[] = [];
  for (const field of unit.fields) {
    const display = field === "categoryId"
      ? resolveCategoryName?.(member.categoryId) ?? member.categoryId
      : DISPLAY_ACCESSORS[field]?.(member) ?? mergeFieldValue(member, field);
    if (display === null || display === "") continue;
    const text = String(display);
    if (!parts.includes(text)) parts.push(text);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** The wire `fieldChoices`: every differing unit's pick, expanded to its fields; survivor picks are omitted. */
export function buildFieldChoices(
  units: readonly MergeFieldUnit[],
  unitChoices: Record<string, string>,
  survivorId: string,
): Partial<Record<MergeScalarField, string>> {
  const fieldChoices: Partial<Record<MergeScalarField, string>> = {};
  for (const unit of units) {
    const chosenId = unitChoices[unit.key];
    if (chosenId === undefined || chosenId === survivorId) continue;
    for (const field of unit.fields) fieldChoices[field] = chosenId;
  }
  return fieldChoices;
}

function unionCount<T>(members: Bookmark[], itemsOf: (member: Bookmark) => T[], keyOf: (item: T) => string): number {
  const keys = new Set<string>();
  for (const member of members) {
    for (const item of itemsOf(member)) keys.add(keyOf(item));
  }
  return keys.size;
}

export interface AssociationSummaryEntry {
  /** English phrase — translate with `t()` at render. */
  label: string;
  count: number;
}

/** Union counts of everything the merge combines automatically; zero-count entries are dropped. */
export function associationSummary(members: Bookmark[]): AssociationSummaryEntry[] {
  const memberIds = new Set(members.map(member => member.id));
  const entries: AssociationSummaryEntry[] = [
    {
      label: "Tags",
      count: unionCount(members, m => m.tags, tag => tag.id),
    },
    {
      label: "Genres & moods",
      count: unionCount(members, m => m.genreMoods, gm => gm.id),
    },
    {
      label: "People",
      count: unionCount(members, m => m.people, person => person.id),
    },
    {
      label: "Groups",
      count: unionCount(members, m => m.groups, group => group.id),
    },
    {
      label: "Locations",
      count: unionCount(members, m => m.locations, location => location.id),
    },
    {
      label: "Images",
      count: members.reduce((total, member) => total + member.images.length, 0),
    },
    {
      label: "Related bookmarks",
      // Edges pointing at another group member collapse into self-edges and are dropped by the merge.
      count: unionCount(
        members,
        m => m.relationships.filter(rel => !memberIds.has(rel.bookmark.id)),
        rel => `${rel.relationshipTypeId}:${rel.bookmark.id}`,
      ),
    },
    {
      label: "Names",
      count: unionCount(members, m => m.names, name => name.language.id),
    },
    {
      label: "Languages",
      count: unionCount(members, m => m.languageUsages, usage => `${usage.language.id}:${usage.level.id}`),
    },
    {
      label: "Property values",
      count: unionCount(
        members,
        m => [
          ...m.numberValues,
          ...m.booleanValues,
          ...m.dateTimeValues,
          ...m.choicesValues,
          ...m.progressValues,
          ...m.sectionsValues,
          ...m.textValues,
          ...m.fileValues,
        ],
        value => value.propertyId,
      ),
    },
  ];
  return entries.filter(entry => entry.count > 0);
}
