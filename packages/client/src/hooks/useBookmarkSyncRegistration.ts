import type { useBookmarkGeneralForm } from "../components/useBookmarkGeneralForm";
import type { BookmarkMediaIdentityField, BookmarkSyncPayload } from "../lib/syncSources/bookmarkDiff";
import type { SyncFieldDiff, SyncProvider } from "../lib/syncSources/syncSourceTypes";
import type { Bookmark, UpdateBookmarkInput } from "@eesimple/types";

import { useCallback, useMemo, useRef } from "react";

import { useTranslation } from "react-i18next";

import { useBookmarkKavitaLink, useBookmarkPlexRatingKey } from "./useBookmarkMediaLinks";
import {
  useAutoBookmarkImage, useIsbnCoverImage, useKavitaCoverImage, usePlexPosterImage, usePodcastArtworkImage, useUpdateBookmark,
} from "./useBookmarks";
import { useRegisterSyncProvider } from "./useRegisterSyncProvider";
import { notifyFieldSaveError, notifyFieldSaved } from "../lib/autoSave";
import { resolveBookmarkDisplayImage } from "../lib/bookmarkImage";
import { notifySuccess } from "../lib/notifications";

type BookmarkForm = ReturnType<typeof useBookmarkGeneralForm>["form"];
type AutoImageMutation = ReturnType<typeof useAutoBookmarkImage>;
type UpdateBookmarkMutation = ReturnType<typeof useUpdateBookmark>;
type ImageImportMutation = ReturnType<typeof useKavitaCoverImage>;

interface BookmarkSyncRegistrationParams {
  bookmark: Bookmark;
  form: BookmarkForm;
  /** Persist the staged Title/Description after they're written into the form (edit-tab auto-save). */
  onFieldStaged: () => void;
}

/** The media-identity scalar columns stageable from a sync row aren't on the TanStack form. */
const MEDIA_IDENTITY_FIELDS = new Set<BookmarkMediaIdentityField>([
  "wikipediaLinkEn", "wikipediaLinkLocal", "itunesUrl", "pocketCastsUrl", "kavitaSeriesName",
]);

/**
 * Registers the bookmark General edit form's {@link SyncProvider} so the header Sync button re-scans
 * the bookmark's URL **and**, for a media-item bookmark carrying its own promoted Plex/Podcast/Kavita/
 * ISBN identity (see #1070), reviews those sources too — one combined multi-group diff under a single
 * `descriptorKind: "bookmark"` provider (bookmarks register only one `SyncProvider` at a time; see the
 * `sync-from-source` skill). `applyStaged` stages Title/Description into the form (persisted via
 * `onFieldStaged`), persists the other media-identity scalar fields directly (they aren't form fields),
 * and applies every image row immediately via the matching existing import mutation (images can't be
 * staged). Kept out of `useBookmarkGeneralForm` so that hook's cognitive complexity doesn't rise.
 */
export function useBookmarkSyncRegistration({
  bookmark, form, onFieldStaged,
}: BookmarkSyncRegistrationParams) {
  const autoImage = useAutoBookmarkImage();
  const updateBookmark = useUpdateBookmark();
  const plexPoster = usePlexPosterImage();
  const kavitaCover = useKavitaCoverImage();
  const podcastArtwork = usePodcastArtworkImage();
  const isbnCover = useIsbnCoverImage();
  const {
    t,
  } = useTranslation();
  const scanUrl = bookmark.url ?? bookmark.originalUrl ?? "";
  const currentImageUrl = resolveBookmarkDisplayImage(bookmark)?.url ?? null;
  const plexRatingKey = useBookmarkPlexRatingKey(bookmark);
  const kavitaLink = useBookmarkKavitaLink(bookmark);

  const ctxRef = useRef<{ bookmark: Bookmark;
    form: BookmarkForm;
    autoImage: AutoImageMutation;
    updateBookmark: UpdateBookmarkMutation;
    plexPoster: ImageImportMutation;
    kavitaCover: ImageImportMutation;
    podcastArtwork: ImageImportMutation;
    isbnCover: ImageImportMutation;
    onFieldStaged: () => void; }>({
    bookmark,
    form,
    autoImage,
    updateBookmark,
    plexPoster,
    kavitaCover,
    podcastArtwork,
    isbnCover,
    onFieldStaged,
  });
  ctxRef.current = {
    bookmark,
    form,
    autoImage,
    updateBookmark,
    plexPoster,
    kavitaCover,
    podcastArtwork,
    isbnCover,
    onFieldStaged,
  };

  const applyStaged = useCallback((selected: SyncFieldDiff[]) => {
    const {
      bookmark: bm, form: f, autoImage: auto, updateBookmark: update, plexPoster: poster,
      kavitaCover: kavita, podcastArtwork: podcast, isbnCover: isbn, onFieldStaged: persist,
    } = ctxRef.current;
    let stagedFields = 0;
    const patch: UpdateBookmarkInput = {};

    for (const row of selected) {
      const payload = row.payload as BookmarkSyncPayload | undefined;
      if (!payload) continue;
      if (payload.kind === "field") {
        if (payload.field === "title") f.setFieldValue("title", payload.value);
        else if (payload.field === "description") f.setFieldValue("description", payload.value);
        else if (MEDIA_IDENTITY_FIELDS.has(payload.field)) patch[payload.field] = payload.value;
        stagedFields += 1;
      }
      else if (payload.kind === "image") {
        if (payload.image === "og") auto.mutate({
          id: bm.id,
          sourceUrl: scanUrl,
        });
        else if (payload.image === "plex-poster") poster.mutate(bm.id);
        else if (payload.image === "kavita-cover") kavita.mutate(bm.id);
        else if (payload.image === "podcast-artwork") podcast.mutate(bm.id);
        else if (payload.image === "isbn-cover") isbn.mutate(bm.id);
      }
    }

    if (Object.keys(patch).length > 0) {
      update.mutate({
        id: bm.id,
        input: patch,
      }, {
        onSuccess: () => notifyFieldSaved(t("Media identity")),
        onError: err => notifyFieldSaveError(t("Media identity"), err.message),
      });
    }
    if (stagedFields > 0) {
      persist();
      notifySuccess(t("Synced from source"));
    }
  }, [scanUrl, t]);

  const provider = useMemo<SyncProvider>(() => ({
    descriptorKind: "bookmark",
    entityLabel: bookmark.title,
    entityId: bookmark.id,
    refs: {
      url: scanUrl,
      currentTitle: bookmark.title,
      currentDescription: bookmark.description ?? null,
      currentImageUrl,
      plexRatingKey,
      currentWikipediaLinkEn: bookmark.wikipediaLinkEn ?? null,
      currentWikipediaLinkLocal: bookmark.wikipediaLinkLocal ?? null,
      feedUrl: bookmark.feedUrl ?? null,
      itunesId: bookmark.itunesId ?? null,
      currentItunesUrl: bookmark.itunesUrl ?? null,
      currentPocketCastsUrl: bookmark.pocketCastsUrl ?? null,
      kavitaSeriesId: kavitaLink?.seriesId ?? null,
      currentKavitaSeriesName: bookmark.kavitaSeriesName ?? null,
      isbn: bookmark.isbn ?? null,
    },
    applyStaged,
  }), [
    bookmark.id, bookmark.title, bookmark.description, bookmark.wikipediaLinkEn, bookmark.wikipediaLinkLocal,
    bookmark.feedUrl, bookmark.itunesId, bookmark.itunesUrl, bookmark.pocketCastsUrl,
    bookmark.kavitaSeriesName, bookmark.isbn, currentImageUrl, plexRatingKey, kavitaLink?.seriesId,
    scanUrl, applyStaged,
  ]);

  useRegisterSyncProvider(provider);
}
