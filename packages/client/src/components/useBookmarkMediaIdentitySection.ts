import type { Bookmark, KavitaSeriesResult, PlexItemResult, UpdateBookmarkInput } from "@eesimple/types";

import { useState } from "react";

import { useUpdateBookmark } from "../hooks/useBookmarks";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

/**
 * The scalar media-identity/metadata columns edited as free-text/number inputs in the section
 * (Plex/Kavita have their own search pickers). Order here is the render order.
 */
export const BOOKMARK_IDENTITY_SCALAR_KEYS = [
  "isbn",
  "year",
  "wikidataId",
  "wikipediaLinkEn",
  "wikipediaLinkLocal",
  "feedUrl",
  "itunesId",
  "itunesUrl",
  "spotifyUrl",
  "pocketCastsUuid",
  "pocketCastsUrl",
  "defaultLinkProvider",
] as const satisfies readonly (keyof Bookmark)[];

export type BookmarkIdentityScalarKey = typeof BOOKMARK_IDENTITY_SCALAR_KEYS[number];

/** The two integer-typed identity columns (everything else is free text). */
const NUMBER_KEYS = new Set<BookmarkIdentityScalarKey>(["year", "itunesId"]);

type Draft = Record<BookmarkIdentityScalarKey, string>;

function draftFromBookmark(bookmark: Bookmark): Draft {
  const draft = {} as Draft;
  for (const key of BOOKMARK_IDENTITY_SCALAR_KEYS) {
    const value = bookmark[key];
    draft[key] = value == null ? "" : String(value);
  }
  return draft;
}

/**
 * Owns the state + immediate-save handlers for the bookmark's promoted media-identity fields
 * (see #1070): the scalar text/number columns (`isbn`, `year`, the Wikidata/Wikipedia links, and the
 * podcast feed/iTunes/Spotify/PocketCasts set) plus the Kavita-series and Plex-item search pickers.
 * Each field saves on its own (edit-tab auto-save standard — no Save button) with a field-named
 * toast, skipping no-op writes and keeping invalid number input rather than reverting it. Keeps
 * `BookmarkMediaIdentitySection` a presentational shell.
 */
export function useBookmarkMediaIdentitySection(bookmark: Bookmark) {
  const update = useUpdateBookmark();
  const [draft, setDraft] = useState<Draft>(() => draftFromBookmark(bookmark));

  function setField(key: BookmarkIdentityScalarKey, value: string): void {
    setDraft(prev => ({
      ...prev,
      [key]: value,
    }));
  }

  function save(input: UpdateBookmarkInput, label: string): void {
    update.mutate(
      {
        id: bookmark.id,
        input,
      },
      {
        onSuccess: () => notifyFieldSaved(label),
        onError: e => notifyFieldSaveError(label, describeError(e)),
      },
    );
  }

  /** Persist a scalar field on blur — parses numbers, coalesces blanks to null, skips no-ops. */
  function saveScalar(key: BookmarkIdentityScalarKey, label: string): void {
    const raw = (draft[key] ?? "").trim();
    let next: string | number | null;
    if (NUMBER_KEYS.has(key)) {
      if (raw === "") next = null;
      else {
        const parsed = Number(raw);
        // Invalid number: keep the user's input, don't save (mirrors the auto-save "invalid skip").
        if (!Number.isFinite(parsed)) return;
        next = Math.trunc(parsed);
      }
    }
    else {
      next = raw === "" ? null : raw;
    }
    const current = bookmark[key] ?? null;
    if (next === current) return;
    save({
      [key]: next,
    }, label);
  }

  function saveKavita(series: KavitaSeriesResult | null): void {
    save(
      series
        ? {
          kavitaSeriesId: series.seriesId,
          kavitaLibraryId: series.libraryId,
          kavitaSeriesName: series.name,
        }
        : {
          kavitaSeriesId: null,
          kavitaLibraryId: null,
          kavitaSeriesName: null,
        },
      "Kavita series",
    );
  }

  function savePlex(item: PlexItemResult | null): void {
    save(
      item
        ? {
          plexRatingKey: item.ratingKey,
          plexItemType: item.type,
          plexItemTitle: item.title,
        }
        : {
          plexRatingKey: null,
          plexItemType: null,
          plexItemTitle: null,
        },
      "Plex item",
    );
  }

  return {
    draft,
    setField,
    saveScalar,
    saveKavita,
    savePlex,
  };
}
