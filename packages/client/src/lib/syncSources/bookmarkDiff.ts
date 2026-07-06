import type { SyncDiff, SyncFieldDiff } from "./syncSourceTypes";
import type { ScanResult } from "@eesimple/types";

import { fillEmptyDefault, rowDiffers } from "./syncSourceTypes";
import i18n from "../../i18n";

/** The bookmark's current values, for building the current-vs-scan diff. */
export interface BookmarkDiffCurrent {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

/** A media-identity text field a diff row can stage into the bookmark's own scalar columns. */
export type BookmarkMediaIdentityField
  = "wikipediaLinkEn" | "wikipediaLinkLocal" | "itunesUrl" | "pocketCastsUrl" | "kavitaSeriesName";

/** What a bookmark diff row carries in `payload` for the registration hook to apply. */
export type BookmarkSyncPayload
  = | { kind: "field";
    field: "title" | "description" | BookmarkMediaIdentityField;
    value: string; }
    | { kind: "image";
      image: "og" | "plex-poster" | "kavita-cover" | "podcast-artwork" | "isbn-cover"; };

/**
 * Builds the "Page metadata" diff group from a fresh `/api/scan` result and the bookmark's current
 * values: Title and Description as staged text rows, and the page (og) image as an immediate-apply
 * image row previewing the scanned thumbnail against the current image. Text rows default to checked
 * only when they fill an empty field. People / language / linked-media covers stay on the existing
 * Rescan + one-click flows (they need match-or-create / post-link resolution). Pure + unit-tested.
 */
export function buildBookmarkDiff(scan: ScanResult, current: BookmarkDiffCurrent): SyncDiff {
  const rows: SyncFieldDiff[] = [];

  if (scan.title && rowDiffers(current.title, scan.title)) {
    rows.push({
      key: "title",
      label: i18n.t("Title"),
      current: current.title,
      next: scan.title,
      kind: "text",
      defaultChecked: fillEmptyDefault(current.title, scan.title),
      payload: {
        kind: "field",
        field: "title",
        value: scan.title,
      },
    });
  }

  if (scan.description && rowDiffers(current.description, scan.description)) {
    rows.push({
      key: "description",
      label: i18n.t("Description"),
      current: current.description,
      next: scan.description,
      kind: "text",
      defaultChecked: fillEmptyDefault(current.description, scan.description),
      payload: {
        kind: "field",
        field: "description",
        value: scan.description,
      },
    });
  }

  const nextImage = scan.thumbnailUrl ?? scan.imageCandidates[0]?.url ?? null;
  if (nextImage) {
    rows.push({
      key: "image",
      label: i18n.t("Page image"),
      current: null,
      next: null,
      kind: "image",
      currentThumb: current.imageUrl,
      nextThumb: nextImage,
      applyImmediately: true,
      defaultChecked: fillEmptyDefault(current.imageUrl, nextImage),
      payload: {
        kind: "image",
        image: "og",
      },
    });
  }

  return {
    groups: [
      {
        source: i18n.t("Page metadata"),
        rows,
      },
    ],
  };
}

/** The bookmark's current values, for building the current-vs-source diff of its own Plex identity. */
export interface BookmarkPlexDiffCurrent {
  title: string | null;
  wikipediaLinkEn: string | null;
  wikipediaLinkLocal: string | null;
  imageUrl: string | null;
}

/** The freshly-resolved Wikidata metadata + Plex poster proxy URL for the bookmark's linked Plex item. */
export interface BookmarkPlexDiffSource {
  name: string | null;
  wikipediaLinkEn: string | null;
  wikipediaLinkLocal: string | null;
  posterUrl: string | null;
}

/**
 * Builds the "Plex" diff group for a bookmark's own promoted Plex identity (see #1070): the resolved
 * Wikidata native name (staged into the bookmark's `title`) + Wikipedia links, plus the Plex poster
 * (applies immediately). Only fields the source returned that differ become rows; text rows default to
 * checked only when they fill an empty field. Pure + unit-tested.
 */
export function buildBookmarkPlexDiff(
  current: BookmarkPlexDiffCurrent,
  source: BookmarkPlexDiffSource,
  sourceLabel: string,
): SyncDiff {
  const rows: SyncFieldDiff[] = [];

  const addField = (key: string, label: string, field: "title" | BookmarkMediaIdentityField, currentValue: string | null, nextValue: string | null) => {
    if (nextValue === null || nextValue === "") return;
    if (!rowDiffers(currentValue, nextValue)) return;
    rows.push({
      key,
      label,
      current: currentValue,
      next: nextValue,
      kind: "text",
      defaultChecked: fillEmptyDefault(currentValue, nextValue),
      payload: {
        kind: "field",
        field,
        value: nextValue,
      },
    });
  };

  addField("plexName", i18n.t("Name (Plex)"), "title", current.title, source.name);
  addField("wikipediaLinkEn", i18n.t("Wikipedia (English)"), "wikipediaLinkEn", current.wikipediaLinkEn, source.wikipediaLinkEn);
  addField("wikipediaLinkLocal", i18n.t("Wikipedia (local)"), "wikipediaLinkLocal", current.wikipediaLinkLocal, source.wikipediaLinkLocal);

  if (source.posterUrl) {
    rows.push({
      key: "plex-poster",
      label: i18n.t("Poster"),
      current: null,
      next: null,
      kind: "image",
      currentThumb: current.imageUrl,
      nextThumb: source.posterUrl,
      applyImmediately: true,
      defaultChecked: fillEmptyDefault(current.imageUrl, source.posterUrl),
      payload: {
        kind: "image",
        image: "plex-poster",
      },
    });
  }

  return {
    groups: rows.length > 0
      ? [{
        source: sourceLabel,
        rows,
      }]
      : [],
  };
}

/** The bookmark's current values, for building the current-vs-source diff of its own podcast identity. */
export interface BookmarkPodcastDiffCurrent {
  title: string | null;
  description: string | null;
  itunesUrl: string | null;
  pocketCastsUrl: string | null;
  imageUrl: string | null;
}

/** The freshly-resolved RSS/iTunes metadata + cross-resolved links for the bookmark's podcast feed. */
export interface BookmarkPodcastDiffSource {
  title: string | null;
  description: string | null;
  itunesUrl: string | null;
  pocketCastsUrl: string | null;
  imageUrl: string | null;
}

/**
 * Builds the "Podcast feed" diff group for a bookmark's own promoted podcast identity (see #1070): the
 * resolved show title (staged into `title`) + description + cross-resolved iTunes/Pocket Casts links,
 * plus the feed artwork (applies immediately). Only fields the source returned that differ become rows.
 * Pure + unit-tested.
 */
export function buildBookmarkPodcastDiff(
  current: BookmarkPodcastDiffCurrent,
  source: BookmarkPodcastDiffSource,
  sourceLabel: string,
): SyncDiff {
  const rows: SyncFieldDiff[] = [];

  const addField = (key: string, label: string, field: "title" | "description" | BookmarkMediaIdentityField, currentValue: string | null, nextValue: string | null) => {
    if (nextValue === null || nextValue === "") return;
    if (!rowDiffers(currentValue, nextValue)) return;
    rows.push({
      key,
      label,
      current: currentValue,
      next: nextValue,
      kind: "text",
      defaultChecked: fillEmptyDefault(currentValue, nextValue),
      payload: {
        kind: "field",
        field,
        value: nextValue,
      },
    });
  };

  addField("podcastName", i18n.t("Name (Podcast)"), "title", current.title, source.title);
  addField("podcastDescription", i18n.t("Description (Podcast)"), "description", current.description, source.description);
  addField("itunesUrl", i18n.t("Apple Podcasts link"), "itunesUrl", current.itunesUrl, source.itunesUrl);
  addField("pocketCastsUrl", i18n.t("Pocket Casts link"), "pocketCastsUrl", current.pocketCastsUrl, source.pocketCastsUrl);

  if (source.imageUrl) {
    rows.push({
      key: "podcast-artwork",
      label: i18n.t("Artwork"),
      current: null,
      next: null,
      kind: "image",
      currentThumb: current.imageUrl,
      nextThumb: source.imageUrl,
      applyImmediately: true,
      defaultChecked: fillEmptyDefault(current.imageUrl, source.imageUrl),
      payload: {
        kind: "image",
        image: "podcast-artwork",
      },
    });
  }

  return {
    groups: rows.length > 0
      ? [{
        source: sourceLabel,
        rows,
      }]
      : [],
  };
}

/** The bookmark's current values, for building the current-vs-source diff of its own Kavita identity. */
export interface BookmarkKavitaDiffCurrent {
  kavitaSeriesName: string | null;
  imageUrl: string | null;
}

/** The freshly-resolved live series name + cover proxy URL for the bookmark's linked Kavita series. */
export interface BookmarkKavitaDiffSource {
  name: string | null;
  coverUrl: string | null;
}

/**
 * Builds the "Kavita" diff group for a bookmark's own linked Kavita series (see #1070): the live series
 * name (staged into `kavitaSeriesName`), plus the series cover (applies immediately). Pure + unit-tested.
 */
export function buildBookmarkKavitaDiff(
  current: BookmarkKavitaDiffCurrent,
  source: BookmarkKavitaDiffSource,
  sourceLabel: string,
): SyncDiff {
  const rows: SyncFieldDiff[] = [];

  if (source.name !== null && source.name !== "" && rowDiffers(current.kavitaSeriesName, source.name)) {
    rows.push({
      key: "kavitaSeriesName",
      label: i18n.t("Series name"),
      current: current.kavitaSeriesName,
      next: source.name,
      kind: "text",
      defaultChecked: fillEmptyDefault(current.kavitaSeriesName, source.name),
      payload: {
        kind: "field",
        field: "kavitaSeriesName",
        value: source.name,
      },
    });
  }

  if (source.coverUrl) {
    rows.push({
      key: "kavita-cover",
      label: i18n.t("Cover"),
      current: null,
      next: null,
      kind: "image",
      currentThumb: current.imageUrl,
      nextThumb: source.coverUrl,
      applyImmediately: true,
      defaultChecked: fillEmptyDefault(current.imageUrl, source.coverUrl),
      payload: {
        kind: "image",
        image: "kavita-cover",
      },
    });
  }

  return {
    groups: rows.length > 0
      ? [{
        source: sourceLabel,
        rows,
      }]
      : [],
  };
}

/** The bookmark's current values, for building the current-vs-source diff of its own ISBN identity. */
export interface BookmarkIsbnDiffCurrent {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

/** The freshly-resolved Open Library / Google Books metadata for the bookmark's stored ISBN. */
export interface BookmarkIsbnDiffSource {
  title: string | null;
  description: string | null;
  coverUrl: string | null;
}

/**
 * Builds the "ISBN metadata" diff group for a bookmark's own stored `isbn` (see #1070): the resolved
 * title (staged into `title`) + description, plus the cover image (applies immediately). Pure +
 * unit-tested.
 */
export function buildBookmarkIsbnDiff(
  current: BookmarkIsbnDiffCurrent,
  source: BookmarkIsbnDiffSource,
  sourceLabel: string,
): SyncDiff {
  const rows: SyncFieldDiff[] = [];

  const addField = (key: string, label: string, field: "title" | "description", currentValue: string | null, nextValue: string | null) => {
    if (nextValue === null || nextValue === "") return;
    if (!rowDiffers(currentValue, nextValue)) return;
    rows.push({
      key,
      label,
      current: currentValue,
      next: nextValue,
      kind: "text",
      defaultChecked: fillEmptyDefault(currentValue, nextValue),
      payload: {
        kind: "field",
        field,
        value: nextValue,
      },
    });
  };

  addField("isbnTitle", i18n.t("Title (ISBN)"), "title", current.title, source.title);
  addField("isbnDescription", i18n.t("Description (ISBN)"), "description", current.description, source.description);

  if (source.coverUrl) {
    rows.push({
      key: "isbn-cover",
      label: i18n.t("Cover"),
      current: null,
      next: null,
      kind: "image",
      currentThumb: current.imageUrl,
      nextThumb: source.coverUrl,
      applyImmediately: true,
      defaultChecked: fillEmptyDefault(current.imageUrl, source.coverUrl),
      payload: {
        kind: "image",
        image: "isbn-cover",
      },
    });
  }

  return {
    groups: rows.length > 0
      ? [{
        source: sourceLabel,
        rows,
      }]
      : [],
  };
}
