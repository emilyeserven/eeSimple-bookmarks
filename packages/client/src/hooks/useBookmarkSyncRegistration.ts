import type { useBookmarkGeneralForm } from "../components/useBookmarkGeneralForm";
import type { BookmarkSyncPayload } from "../lib/syncSources/bookmarkDiff";
import type { SyncFieldDiff, SyncProvider } from "../lib/syncSources/syncSourceTypes";
import type { Bookmark } from "@eesimple/types";

import { useCallback, useMemo, useRef } from "react";

import { useAutoBookmarkImage } from "./useBookmarks";
import { useRegisterSyncProvider } from "./useRegisterSyncProvider";
import { resolveBookmarkDisplayImage } from "../lib/bookmarkImage";
import { notifySuccess } from "../lib/notifications";

type BookmarkForm = ReturnType<typeof useBookmarkGeneralForm>["form"];
type AutoImageMutation = ReturnType<typeof useAutoBookmarkImage>;

interface BookmarkSyncRegistrationParams {
  bookmark: Bookmark;
  form: BookmarkForm;
}

/**
 * Registers the bookmark General edit form's {@link SyncProvider} so the header Sync button re-scans
 * the bookmark's URL. `applyStaged` stages the selected Title/Description into the form (persisted by
 * the tab's Save button — the review-then-save flow) and applies the page-image row immediately via
 * the existing auto-image mutation (images can't be staged into a form field). Kept out of
 * `useBookmarkGeneralForm` so that hook's cognitive complexity doesn't rise.
 */
export function useBookmarkSyncRegistration({
  bookmark, form,
}: BookmarkSyncRegistrationParams) {
  const autoImage = useAutoBookmarkImage();
  const scanUrl = bookmark.url ?? bookmark.originalUrl ?? "";
  const currentImageUrl = resolveBookmarkDisplayImage(bookmark)?.url ?? null;

  const ctxRef = useRef<{ bookmark: Bookmark;
    form: BookmarkForm;
    autoImage: AutoImageMutation; }>({
    bookmark,
    form,
    autoImage,
  });
  ctxRef.current = {
    bookmark,
    form,
    autoImage,
  };

  const applyStaged = useCallback((selected: SyncFieldDiff[]) => {
    const {
      bookmark: bm, form: f, autoImage: auto,
    } = ctxRef.current;
    let stagedFields = 0;
    for (const row of selected) {
      const payload = row.payload as BookmarkSyncPayload | undefined;
      if (!payload) continue;
      if (payload.kind === "field") {
        if (payload.field === "title") f.setFieldValue("title", payload.value);
        else f.setFieldValue("description", payload.value);
        stagedFields += 1;
      }
      else if (payload.kind === "image" && payload.image === "og") {
        auto.mutate({
          id: bm.id,
          sourceUrl: scanUrl,
        });
      }
    }
    if (stagedFields > 0) {
      notifySuccess("Synced from source — review and save");
    }
  }, [scanUrl]);

  const provider = useMemo<SyncProvider>(() => ({
    descriptorKind: "bookmark",
    entityLabel: bookmark.title,
    entityId: bookmark.id,
    refs: {
      url: scanUrl,
      currentTitle: bookmark.title,
      currentDescription: bookmark.description ?? null,
      currentImageUrl,
    },
    applyStaged,
  }), [bookmark.id, bookmark.title, bookmark.description, currentImageUrl, scanUrl, applyStaged]);

  useRegisterSyncProvider(provider);
}
