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
} from "@eesimple/types";
import { type BookmarkRow } from "@/db/schema";
import { loadLanguageUsages } from "@/services/languageUsages";
import { loadTaxonomyTermsForOwners } from "@/services/taxonomyAssignments";
import { loadEntityNames } from "@/services/entityNames";
import { resolveDefaultCategoryId } from "@/services/categories";
import { channelsById, importsById, mediaTypesById, newslettersById, websitesById } from "@/services/bookmarkHydrationEntities";
import {
  blacklistedLocationIdsByBookmarkId,
  blacklistedTagIdsByBookmarkId,
  genreMoodsByBookmarkId,
  groupsByBookmarkId,
  locationsByBookmarkId,
  peopleByBookmarkId,
  relationshipsByBookmarkId,
  tagsByBookmarkId,
} from "@/services/bookmarkHydrationRelations";
import {
  booleanValuesByBookmarkId,
  choicesValuesByBookmarkId,
  dateTimeValuesByBookmarkId,
  fileValuesByBookmarkId,
  imagesByBookmarkId,
  numberValuesByBookmarkId,
  progressValuesByBookmarkId,
  reelArchivesByBookmarkId,
  screenshotsByBookmarkId,
  sectionsValuesByBookmarkId,
  textValuesByBookmarkId,
} from "@/services/bookmarkHydrationValues";

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
