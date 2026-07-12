import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkPerson,
  BookmarkBooleanValue,
  BookmarkChoicesValue,
  BookmarkDateTimeValue,
  BookmarkFileValue,
  BookmarkImage,
  BookmarkImport,
  BookmarkEntityName,
  BookmarkLanguageUsage,
  BookmarkLocation,
  BookmarkMediaType,
  BookmarkGroup,
  BookmarkNewsletter,
  BookmarkNumberValue,
  BookmarkProgressValue,
  BookmarkRelationship,
  BookmarkScreenshotSettings,
  BookmarkSectionsValue,
  BookmarkGenreMood,
  BookmarkTaxonomyTerm,
  BookmarkTag,
  BookmarkTextValue,
  BookmarkWebsite,
  BookmarkYouTubeChannel,
  ImageDisplayPreference,
  InstagramReelArchive,
  RelationshipRole,
  SectionEntry,
} from "@eesimple/types";
import { db } from "@/db";
import {
  people,
  bookmarkPeople,
  bookmarkGroups,
  bookmarkBooleanValues,
  bookmarkChoicesValues,
  bookmarkDateTimeValues,
  bookmarkFileValues,
  bookmarkImages,
  bookmarkLocationBlacklist,
  bookmarkLocations,
  bookmarkNumberValues,
  bookmarkProgressValues,
  bookmarkReelArchives,
  bookmarkScreenshots,
  bookmarkSectionsValues,
  bookmarkTextValues,
  bookmarkRelationships,
  bookmarks,
  type BookmarkRow,
  bookmarkTagBlacklist,
  bookmarkTags,
  imports,
  mediaTypes,
  newsletters,
  groups,
  locations,
  locationRelations,
  relationshipTypes,
  tags,
  taxonomyAssignments,
  taxonomyTerms,
  websiteFavicons,
  websites,
  youtubeChannelImages,
  youtubeChannels,
} from "@/db/schema";
import { loadLanguageUsages } from "@/services/languageUsages";
import { getGenreMoodsTaxonomyId } from "@/services/taxonomies";
import { loadTaxonomyTermsForOwners } from "@/services/taxonomyAssignments";
import { loadEntityNames } from "@/services/entityNames";
import { bookmarkImageFromRow, bookmarkScreenshotFromRow, bookmarkScreenshotSettingsFromRow } from "@/services/bookmarkImages";
import { reelArchiveFromRow } from "@/services/reelArchive";
import { bookmarkFileValueFromRow } from "@/services/bookmarkPropertyFiles";
import { resolveDefaultCategoryId } from "@/services/categories";
import { slugify } from "@/utils/slug";

/** The hydrated relations that acgroup a bookmark row. */
interface BookmarkExtras {
  website: BookmarkWebsite | null;
  mediaType: BookmarkMediaType | null;
  languageUsages: BookmarkLanguageUsage[];
  names: BookmarkEntityName[];
  youtubeChannel: BookmarkYouTubeChannel | null;
  newsletter: BookmarkNewsletter | null;
  import: BookmarkImport | null;
  tags: BookmarkTag[];
  genreMoods: BookmarkGenreMood[];
  taxonomyTerms: BookmarkTaxonomyTerm[];
  locations: BookmarkLocation[];
  blacklistedTagIds: string[];
  blacklistedLocationIds: string[];
  people: BookmarkPerson[];
  groups: BookmarkGroup[];
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
  choicesValues: BookmarkChoicesValue[];
  progressValues: BookmarkProgressValue[];
  sectionsValues: BookmarkSectionsValue[];
  textValues: BookmarkTextValue[];
  fileValues: BookmarkFileValue[];
  images: BookmarkImage[];
  screenshot: BookmarkImage | null;
  screenshotSettings: BookmarkScreenshotSettings | null;
  reelArchive: InstagramReelArchive | null;
  relationships: BookmarkRelationship[];
}

const EMPTY_EXTRAS: BookmarkExtras = {
  website: null,
  mediaType: null,
  languageUsages: [],
  names: [],
  youtubeChannel: null,
  newsletter: null,
  import: null,
  tags: [],
  genreMoods: [],
  taxonomyTerms: [],
  locations: [],
  blacklistedTagIds: [],
  blacklistedLocationIds: [],
  people: [],
  groups: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  choicesValues: [],
  progressValues: [],
  sectionsValues: [],
  textValues: [],
  fileValues: [],
  images: [],
  screenshot: null,
  screenshotSettings: null,
  reelArchive: null,
  relationships: [],
};

/** Map a DB row plus its hydrated relations to the shared `Bookmark` wire type. */
function toBookmark(row: BookmarkRow, extras: BookmarkExtras, defaultCategoryId: string): Bookmark {
  return {
    id: row.id,
    url: row.url,
    originalUrl: row.originalUrl,
    secondaryUrl: row.secondaryUrl,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId ?? defaultCategoryId,
    website: extras.website,
    mediaType: extras.mediaType,
    languageUsages: extras.languageUsages,
    names: extras.names,
    youtubeChannel: extras.youtubeChannel,
    newsletter: extras.newsletter,
    kavitaSeriesId: row.kavitaSeriesId,
    kavitaLibraryId: row.kavitaLibraryId,
    kavitaSeriesName: row.kavitaSeriesName,
    plexRatingKey: row.plexRatingKey,
    plexItemType: row.plexItemType,
    plexItemTitle: row.plexItemTitle,
    isbn: row.isbn,
    year: row.year,
    wikidataId: row.wikidataId,
    wikipediaLinkEn: row.wikipediaLinkEn,
    wikipediaLinkLocal: row.wikipediaLinkLocal,
    feedUrl: row.feedUrl,
    itunesId: row.itunesId,
    itunesUrl: row.itunesUrl,
    spotifyUrl: row.spotifyUrl,
    pocketCastsUuid: row.pocketCastsUuid,
    pocketCastsUrl: row.pocketCastsUrl,
    defaultLinkProvider: row.defaultLinkProvider,
    import: extras.import,
    tags: extras.tags,
    genreMoods: extras.genreMoods,
    taxonomyTerms: extras.taxonomyTerms,
    locations: extras.locations,
    blacklistedTagIds: extras.blacklistedTagIds,
    blacklistedLocationIds: extras.blacklistedLocationIds,
    people: extras.people,
    groups: extras.groups,
    numberValues: extras.numberValues,
    booleanValues: extras.booleanValues,
    dateTimeValues: extras.dateTimeValues,
    choicesValues: extras.choicesValues,
    progressValues: extras.progressValues,
    sectionsValues: extras.sectionsValues,
    textValues: extras.textValues,
    fileValues: extras.fileValues,
    relationships: extras.relationships,
    image: extras.images.find(img => img.isMain) ?? extras.images[0] ?? null,
    images: extras.images,
    screenshot: extras.screenshot,
    screenshotSettings: extras.screenshotSettings,
    imageDisplayPreference: (row.imageDisplayPreference as ImageDisplayPreference | null) ?? "auto",
    reelArchive: extras.reelArchive,
    imageAutoGrabError: (row.imageAutoGrabError as "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error" | null) ?? null,
    priority: row.priority,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : null,
  };
}

/** Load websites for a set of website ids in a single query, keyed by website id. */
async function websitesById(websiteIds: string[]): Promise<Map<string, BookmarkWebsite>> {
  const byId = new Map<string, BookmarkWebsite>();
  if (websiteIds.length === 0) return byId;

  const rows = await db
    .select({
      id: websites.id,
      domain: websites.domain,
      siteName: websites.siteName,
      slug: websites.slug,
      faviconCreatedAt: websiteFavicons.createdAt,
    })
    .from(websites)
    .leftJoin(websiteFavicons, eq(websiteFavicons.websiteId, websites.id))
    .where(inArray(websites.id, websiteIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      domain: row.domain,
      siteName: row.siteName,
      slug: row.slug ?? (row.domain.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-") || "website"),
      imageUrl: row.faviconCreatedAt
        ? `/api/websites/${row.id}/image?v=${new Date(row.faviconCreatedAt).getTime()}`
        : null,
    });
  }
  return byId;
}

/** Load media types for a set of media-type ids in a single query, keyed by media-type id. */
async function mediaTypesById(mediaTypeIds: string[]): Promise<Map<string, BookmarkMediaType>> {
  const byId = new Map<string, BookmarkMediaType>();
  if (mediaTypeIds.length === 0) return byId;

  const rows = await db
    .select({
      id: mediaTypes.id,
      name: mediaTypes.name,
      slug: mediaTypes.slug,
      icon: mediaTypes.icon,
      parentId: mediaTypes.parentId,
      builtIn: mediaTypes.builtIn,
    })
    .from(mediaTypes)
    .where(inArray(mediaTypes.id, mediaTypeIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
      icon: row.icon ?? null,
      parentId: row.parentId,
      builtIn: row.builtIn,
    });
  }
  return byId;
}

/** Load YouTube channels for a set of channel ids in a single query, keyed by channel id. */
async function channelsById(channelIds: string[]): Promise<Map<string, BookmarkYouTubeChannel>> {
  const byId = new Map<string, BookmarkYouTubeChannel>();
  if (channelIds.length === 0) return byId;

  const rows = await db
    .select({
      id: youtubeChannels.id,
      name: youtubeChannels.name,
      slug: youtubeChannels.slug,
      imageCreatedAt: youtubeChannelImages.createdAt,
    })
    .from(youtubeChannels)
    .leftJoin(youtubeChannelImages, eq(youtubeChannelImages.youtubeChannelId, youtubeChannels.id))
    .where(inArray(youtubeChannels.id, channelIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
      imageUrl: row.imageCreatedAt
        ? `/api/youtube-channels/${row.id}/image?v=${new Date(row.imageCreatedAt).getTime()}`
        : null,
    });
  }
  return byId;
}

/** Load newsletters for a set of newsletter ids in a single query, keyed by newsletter id. */
async function newslettersById(newsletterIds: string[]): Promise<Map<string, BookmarkNewsletter>> {
  const byId = new Map<string, BookmarkNewsletter>();
  if (newsletterIds.length === 0) return byId;

  const rows = await db
    .select({
      id: newsletters.id,
      name: newsletters.name,
      slug: newsletters.slug,
    })
    .from(newsletters)
    .where(inArray(newsletters.id, newsletterIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
    });
  }
  return byId;
}

/** Load import events for a set of import ids, keyed by import id. */
async function importsById(importIds: string[]): Promise<Map<string, BookmarkImport>> {
  const byId = new Map<string, BookmarkImport>();
  if (importIds.length === 0) return byId;

  const rows = await db
    .select({
      id: imports.id,
      title: imports.title,
      createdAt: imports.createdAt,
    })
    .from(imports)
    .where(inArray(imports.id, importIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    });
  }
  return byId;
}

/** Load blacklisted tag IDs for a set of bookmark ids in a single query, grouped by bookmark id. */
async function blacklistedTagIdsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTagBlacklist.bookmarkId,
      tagId: bookmarkTagBlacklist.tagId,
    })
    .from(bookmarkTagBlacklist)
    .where(inArray(bookmarkTagBlacklist.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push(row.tagId);
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load blacklisted location IDs for a set of bookmark ids in a single query, grouped by bookmark id. */
async function blacklistedLocationIdsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkLocationBlacklist.bookmarkId,
      locationId: bookmarkLocationBlacklist.locationId,
    })
    .from(bookmarkLocationBlacklist)
    .where(inArray(bookmarkLocationBlacklist.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push(row.locationId);
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load people for a set of bookmark ids in a single query, grouped by bookmark id. */
async function peopleByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkPerson[]>> {
  const grouped = new Map<string, BookmarkPerson[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkPeople.bookmarkId,
      id: people.id,
      name: people.name,
      slug: people.slug,
    })
    .from(bookmarkPeople)
    .innerJoin(people, eq(bookmarkPeople.personId, people.id))
    .where(inArray(bookmarkPeople.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load group (creator) credits for a set of bookmark ids in one query, grouped by bookmark id. */
async function groupsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkGroup[]>> {
  const grouped = new Map<string, BookmarkGroup[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkGroups.bookmarkId,
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
    })
    .from(bookmarkGroups)
    .innerJoin(groups, eq(bookmarkGroups.groupId, groups.id))
    .where(inArray(bookmarkGroups.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load tags for a set of bookmark ids in a single query, grouped by bookmark id. */
async function tagsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkTag[]>> {
  const grouped = new Map<string, BookmarkTag[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTags.bookmarkId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      parentId: tags.parentId,
      editableOnCard: tags.editableOnCard,
    })
    .from(bookmarkTags)
    .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
    .where(inArray(bookmarkTags.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
      parentId: row.parentId,
      editableOnCard: row.editableOnCard,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/**
 * Load Genres & Moods entries for a set of bookmark ids, grouped by bookmark id. After the cutover
 * G&M is an ordinary taxonomy, so this reads `taxonomy_assignments` scoped to the G&M taxonomy id
 * joined to `taxonomy_terms`. Returns an empty map when G&M has been demoted away.
 */
async function genreMoodsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkGenreMood[]>> {
  const grouped = new Map<string, BookmarkGenreMood[]>();
  if (bookmarkIds.length === 0) return grouped;
  const taxonomyId = await getGenreMoodsTaxonomyId();
  if (!taxonomyId) return grouped;

  const rows = await db
    .select({
      bookmarkId: taxonomyAssignments.ownerId,
      id: taxonomyTerms.id,
      name: taxonomyTerms.name,
      slug: taxonomyTerms.slug,
      parentId: taxonomyTerms.parentId,
    })
    .from(taxonomyAssignments)
    .innerJoin(taxonomyTerms, eq(taxonomyAssignments.termId, taxonomyTerms.id))
    .where(and(
      eq(taxonomyAssignments.taxonomyId, taxonomyId),
      eq(taxonomyAssignments.ownerType, "bookmark"),
      inArray(taxonomyAssignments.ownerId, bookmarkIds),
    ));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
      parentId: row.parentId,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load locations for a set of bookmark ids in a single query, grouped by bookmark id. */
async function locationsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkLocation[]>> {
  const grouped = new Map<string, BookmarkLocation[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkLocations.bookmarkId,
      id: locations.id,
      name: locations.name,
      slug: locations.slug,
      parentId: locations.parentId,
      placeType: locations.placeType,
      relationId: locationRelations.id,
      relationName: locationRelations.name,
      relationSlug: locationRelations.slug,
    })
    .from(bookmarkLocations)
    .innerJoin(locations, eq(bookmarkLocations.locationId, locations.id))
    .leftJoin(locationRelations, eq(bookmarkLocations.locationRelationId, locationRelations.id))
    .where(inArray(bookmarkLocations.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
      parentId: row.parentId,
      placeType: row.placeType,
      locationRelation: row.relationId
        ? {
          id: row.relationId,
          name: row.relationName ?? "",
          slug: row.relationSlug ?? slugify(row.relationName ?? ""),
        }
        : null,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load number custom-property values for a set of bookmarks, grouped by bookmark id. */
async function numberValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkNumberValue[]>> {
  const grouped = new Map<string, BookmarkNumberValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkNumberValues.bookmarkId,
      propertyId: bookmarkNumberValues.propertyId,
      value: bookmarkNumberValues.value,
      valueEnd: bookmarkNumberValues.valueEnd,
    })
    .from(bookmarkNumberValues)
    .where(inArray(bookmarkNumberValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
      valueEnd: row.valueEnd ?? null,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load boolean custom-property values for a set of bookmarks, grouped by bookmark id. */
async function booleanValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkBooleanValue[]>> {
  const grouped = new Map<string, BookmarkBooleanValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkBooleanValues.bookmarkId,
      propertyId: bookmarkBooleanValues.propertyId,
      value: bookmarkBooleanValues.value,
    })
    .from(bookmarkBooleanValues)
    .where(inArray(bookmarkBooleanValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load date/time custom-property values for a set of bookmarks, grouped by bookmark id. */
async function dateTimeValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkDateTimeValue[]>> {
  const grouped = new Map<string, BookmarkDateTimeValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkDateTimeValues.bookmarkId,
      propertyId: bookmarkDateTimeValues.propertyId,
      value: bookmarkDateTimeValues.value,
    })
    .from(bookmarkDateTimeValues)
    .where(inArray(bookmarkDateTimeValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load choices custom-property values for a set of bookmarks, grouped by bookmark id. */
async function choicesValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkChoicesValue[]>> {
  const grouped = new Map<string, BookmarkChoicesValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkChoicesValues.bookmarkId,
      propertyId: bookmarkChoicesValues.propertyId,
      values: bookmarkChoicesValues.values,
    })
    .from(bookmarkChoicesValues)
    .where(inArray(bookmarkChoicesValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      values: row.values as string[],
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load item-in-items custom-property values for a set of bookmarks, grouped by bookmark id. */
async function progressValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkProgressValue[]>> {
  const grouped = new Map<string, BookmarkProgressValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkProgressValues.bookmarkId,
      propertyId: bookmarkProgressValues.propertyId,
      current: bookmarkProgressValues.current,
      total: bookmarkProgressValues.total,
      textOverride: bookmarkProgressValues.textOverride,
      autoSpace: bookmarkProgressValues.autoSpace,
    })
    .from(bookmarkProgressValues)
    .where(inArray(bookmarkProgressValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      current: row.current,
      total: row.total,
      textOverride: row.textOverride as BookmarkProgressValue["textOverride"],
      autoSpace: row.autoSpace,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load sections custom-property values for a set of bookmarks, grouped by bookmark id. */
async function sectionsValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkSectionsValue[]>> {
  const grouped = new Map<string, BookmarkSectionsValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkSectionsValues.bookmarkId,
      propertyId: bookmarkSectionsValues.propertyId,
      exhaustive: bookmarkSectionsValues.exhaustive,
      sections: bookmarkSectionsValues.sections,
    })
    .from(bookmarkSectionsValues)
    .where(inArray(bookmarkSectionsValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      exhaustive: row.exhaustive,
      sections: row.sections as SectionEntry[],
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load text custom-property values for a set of bookmarks, grouped by bookmark id. */
async function textValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkTextValue[]>> {
  const grouped = new Map<string, BookmarkTextValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTextValues.bookmarkId,
      propertyId: bookmarkTextValues.propertyId,
      value: bookmarkTextValues.value,
    })
    .from(bookmarkTextValues)
    .where(inArray(bookmarkTextValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load image/file custom-property values for a set of bookmarks, grouped by bookmark id. */
async function fileValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkFileValue[]>> {
  const grouped = new Map<string, BookmarkFileValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select()
    .from(bookmarkFileValues)
    .where(inArray(bookmarkFileValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push(bookmarkFileValueFromRow(row));
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/**
 * Load attached images for a set of bookmarks in a single query, keyed by bookmark id. Each value is
 * the bookmark's full image list ordered main-first then by `sortOrder` (a bookmark may hold several).
 */
async function imagesByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkImage[]>> {
  const byId = new Map<string, BookmarkImage[]>();
  if (bookmarkIds.length === 0) return byId;

  const rows = await db
    .select()
    .from(bookmarkImages)
    .where(inArray(bookmarkImages.bookmarkId, bookmarkIds))
    .orderBy(desc(bookmarkImages.isMain), asc(bookmarkImages.sortOrder), asc(bookmarkImages.createdAt));

  for (const row of rows) {
    const list = byId.get(row.bookmarkId) ?? [];
    list.push(bookmarkImageFromRow(row));
    byId.set(row.bookmarkId, list);
  }
  return byId;
}

/** A hydrated screenshot: the wire image plus the capture settings last used to take it. */
interface ScreenshotHydration {
  image: BookmarkImage;
  settings: BookmarkScreenshotSettings;
}

/** Load screenshots for a set of bookmarks in a single query, keyed by bookmark id. */
async function screenshotsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, ScreenshotHydration>> {
  const byId = new Map<string, ScreenshotHydration>();
  if (bookmarkIds.length === 0) return byId;

  const rows = await db
    .select()
    .from(bookmarkScreenshots)
    .where(inArray(bookmarkScreenshots.bookmarkId, bookmarkIds));

  for (const row of rows) {
    byId.set(row.bookmarkId, {
      image: bookmarkScreenshotFromRow(row),
      settings: bookmarkScreenshotSettingsFromRow(row),
    });
  }
  return byId;
}

/** Load archived reels for a set of bookmarks in a single query, keyed by bookmark id. */
async function reelArchivesByBookmarkId(bookmarkIds: string[]): Promise<Map<string, InstagramReelArchive>> {
  const byId = new Map<string, InstagramReelArchive>();
  if (bookmarkIds.length === 0) return byId;

  const rows = await db
    .select()
    .from(bookmarkReelArchives)
    .where(inArray(bookmarkReelArchives.bookmarkId, bookmarkIds));

  for (const row of rows) {
    byId.set(row.bookmarkId, reelArchiveFromRow(row));
  }
  return byId;
}

/**
 * Load typed relationships for a set of bookmark ids, handling both sides of each edge. Returns a
 * map of bookmarkId → its {@link BookmarkRelationship}s, with the other bookmark's role derived from
 * the edge direction: for a directional type, A is the parent and B the child; symmetric types are
 * `related`. Each row is joined to its relationship type for the name + `directional` flag.
 */
async function relationshipsByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkRelationship[]>> {
  const grouped = new Map<string, BookmarkRelationship[]>();
  if (bookmarkIds.length === 0) return grouped;

  const idSet = new Set(bookmarkIds);

  const rels = await db
    .select({
      bookmarkAId: bookmarkRelationships.bookmarkAId,
      bookmarkBId: bookmarkRelationships.bookmarkBId,
      relationshipTypeId: bookmarkRelationships.relationshipTypeId,
      label: bookmarkRelationships.label,
      typeName: relationshipTypes.name,
      typeBuiltIn: relationshipTypes.builtIn,
      directional: relationshipTypes.directional,
    })
    .from(bookmarkRelationships)
    .innerJoin(
      relationshipTypes,
      eq(bookmarkRelationships.relationshipTypeId, relationshipTypes.id),
    )
    .where(
      or(
        inArray(bookmarkRelationships.bookmarkAId, bookmarkIds),
        inArray(bookmarkRelationships.bookmarkBId, bookmarkIds),
      ),
    );

  if (rels.length === 0) return grouped;

  // Collect all "other" bookmark ids we need to fetch (may include ids outside our batch).
  const otherIds = new Set<string>();
  for (const rel of rels) {
    if (idSet.has(rel.bookmarkAId)) otherIds.add(rel.bookmarkBId);
    if (idSet.has(rel.bookmarkBId)) otherIds.add(rel.bookmarkAId);
  }

  const otherRows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(inArray(bookmarks.id, [...otherIds]));

  const otherById = new Map(otherRows.map(row => [row.id, row]));

  for (const rel of rels) {
    const addTo = (ownId: string, otherId: string, ownIsParent: boolean) => {
      if (!idSet.has(ownId)) return;
      const other = otherById.get(otherId);
      if (!other) return;
      const role: RelationshipRole = !rel.directional
        ? "related"
        : ownIsParent
          ? "child" // the OTHER bookmark is the child
          : "parent";
      const list = grouped.get(ownId) ?? [];
      list.push({
        bookmark: {
          id: other.id,
          url: other.url ?? null,
          title: other.title,
        },
        relationshipTypeId: rel.relationshipTypeId,
        relationshipTypeName: rel.typeName,
        relationshipTypeBuiltIn: rel.typeBuiltIn ?? false,
        directional: rel.directional,
        role,
        label: rel.label,
      });
      grouped.set(ownId, list);
    };
    // A is the parent/source, B is the child/target (for directional types).
    addTo(rel.bookmarkAId, rel.bookmarkBId, true);
    addTo(rel.bookmarkBId, rel.bookmarkAId, false);
  }

  return grouped;
}

/** Hydrate all custom-property relations for a set of bookmark rows in batched queries. */
async function extrasByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkExtras>> {
  const [tagsMap, genreMoodsMap, taxonomyTermsMap, locationsMap, blacklistedMap, blacklistedLocationMap, peopleMap, bmGroupsMap, numberMap, booleanMap, dateTimeMap, choicesMap, progressMap, sectionsMap, textMap, fileMap, imageMap, screenshotMap, reelArchiveMap, relationshipsMap, languageUsagesMap, entityNamesMap] = await Promise.all([
    tagsByBookmarkId(bookmarkIds),
    genreMoodsByBookmarkId(bookmarkIds),
    loadTaxonomyTermsForOwners("bookmark", bookmarkIds),
    locationsByBookmarkId(bookmarkIds),
    blacklistedTagIdsByBookmarkId(bookmarkIds),
    blacklistedLocationIdsByBookmarkId(bookmarkIds),
    peopleByBookmarkId(bookmarkIds),
    groupsByBookmarkId(bookmarkIds),
    numberValuesByBookmarkId(bookmarkIds),
    booleanValuesByBookmarkId(bookmarkIds),
    dateTimeValuesByBookmarkId(bookmarkIds),
    choicesValuesByBookmarkId(bookmarkIds),
    progressValuesByBookmarkId(bookmarkIds),
    sectionsValuesByBookmarkId(bookmarkIds),
    textValuesByBookmarkId(bookmarkIds),
    fileValuesByBookmarkId(bookmarkIds),
    imagesByBookmarkId(bookmarkIds),
    screenshotsByBookmarkId(bookmarkIds),
    reelArchivesByBookmarkId(bookmarkIds),
    relationshipsByBookmarkId(bookmarkIds),
    loadLanguageUsages("bookmark", bookmarkIds),
    loadEntityNames("bookmark", bookmarkIds),
  ]);
  const grouped = new Map<string, BookmarkExtras>();
  for (const id of bookmarkIds) {
    grouped.set(id, {
      website: null,
      mediaType: null,
      languageUsages: languageUsagesMap.get(id) ?? [],
      names: entityNamesMap.get(id) ?? [],
      youtubeChannel: null,
      newsletter: null,
      import: null,
      tags: tagsMap.get(id) ?? [],
      genreMoods: genreMoodsMap.get(id) ?? [],
      taxonomyTerms: taxonomyTermsMap.get(id) ?? [],
      locations: locationsMap.get(id) ?? [],
      blacklistedTagIds: blacklistedMap.get(id) ?? [],
      blacklistedLocationIds: blacklistedLocationMap.get(id) ?? [],
      people: peopleMap.get(id) ?? [],
      groups: bmGroupsMap.get(id) ?? [],
      numberValues: numberMap.get(id) ?? [],
      booleanValues: booleanMap.get(id) ?? [],
      dateTimeValues: dateTimeMap.get(id) ?? [],
      choicesValues: choicesMap.get(id) ?? [],
      progressValues: progressMap.get(id) ?? [],
      sectionsValues: sectionsMap.get(id) ?? [],
      textValues: textMap.get(id) ?? [],
      fileValues: fileMap.get(id) ?? [],
      images: imageMap.get(id) ?? [],
      screenshot: screenshotMap.get(id)?.image ?? null,
      screenshotSettings: screenshotMap.get(id)?.settings ?? null,
      reelArchive: reelArchiveMap.get(id) ?? null,
      relationships: relationshipsMap.get(id) ?? [],
    });
  }
  return grouped;
}

/** Hydrate a list of bookmark rows into wire types (shared by list/get/homepage/sections). */
export async function hydrateBookmarkRows(rows: BookmarkRow[]): Promise<Bookmark[]> {
  if (rows.length === 0) return [];
  const defaultCategoryId = await resolveDefaultCategoryId();
  const websiteIds = [...new Set(rows.map(row => row.websiteId).filter((id): id is string => id !== null))];
  const mediaTypeIds = [...new Set(rows.map(row => row.mediaTypeId).filter((id): id is string => id !== null))];
  const channelIds = [...new Set(rows.map(row => row.youtubeChannelId).filter((id): id is string => id !== null))];
  const newsletterIds = [...new Set(rows.map(row => row.newsletterId).filter((id): id is string => id !== null))];
  const issueIds = [...new Set(rows.map(row => row.importId).filter((id): id is string => id !== null))];
  const [grouped, websiteMap, mediaTypeMap, channelMap, newsletterMap, importMap] = await Promise.all([
    extrasByBookmarkId(rows.map(row => row.id)),
    websitesById(websiteIds),
    mediaTypesById(mediaTypeIds),
    channelsById(channelIds),
    newslettersById(newsletterIds),
    importsById(issueIds),
  ]);
  return rows.map((row) => {
    const extras = grouped.get(row.id) ?? EMPTY_EXTRAS;
    return toBookmark(row, {
      ...extras,
      website: row.websiteId ? websiteMap.get(row.websiteId) ?? null : null,
      mediaType: row.mediaTypeId ? mediaTypeMap.get(row.mediaTypeId) ?? null : null,
      youtubeChannel: row.youtubeChannelId ? channelMap.get(row.youtubeChannelId) ?? null : null,
      newsletter: row.newsletterId ? newsletterMap.get(row.newsletterId) ?? null : null,
      import: row.importId ? importMap.get(row.importId) ?? null : null,
    }, defaultCategoryId);
  });
}
