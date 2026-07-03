import type { BookmarkImageEditFormController } from "./useBookmarkImageEditForm";
import type { Bookmark } from "@eesimple/types";

import { BookImage, BookOpen, Search, Sparkles, Tv } from "lucide-react";

import { BookmarkImageDisplayToggle } from "./BookmarkImageDisplayToggle";
import { BookmarkImagePicker } from "./BookmarkImagePicker";
import { BookmarkScreenshotSection } from "./BookmarkScreenshotSection";
import { useBookmarkImageEditForm } from "./useBookmarkImageEditForm";

import { Button } from "@/components/ui/button";

interface BookmarkImageEditFormProps {
  bookmark: Bookmark;
}

/** The save button plus the source-dependent image import actions (page scan, Kavita, ISBN). */
function ImageActionButtons({
  pageUrl,
  c,
}: {
  pageUrl: string | null;
  c: BookmarkImageEditFormController;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="submit"
        size="sm"
        disabled={c.isPending || c.isMutating}
      >
        {c.isPending || c.isMutating ? "Saving…" : "Save changes"}
      </Button>
      {pageUrl
        ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={c.isScanning}
              onClick={c.onFindImages}
            >
              <Search className="size-4" />
              {c.isScanning ? "Finding…" : "Find images on page"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={c.getPageImagePending}
              title="Fetch the page's preview image (og:image)"
              onClick={c.onGetPageImage}
            >
              <Sparkles className="size-4" />
              {c.getPageImagePending ? "Fetching…" : "Get page image"}
            </Button>
          </>
        )
        : null}
      {c.canUseKavitaCover
        ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={c.kavitaCoverPending}
            title="Import the linked Kavita series' cover as the main image"
            onClick={c.onUseKavitaCover}
          >
            <BookOpen className="size-4" />
            {c.kavitaCoverPending ? "Importing…" : "Use Kavita cover"}
          </Button>
        )
        : null}
      {c.canUsePlexPoster
        ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={c.plexPosterPending}
            title="Import the linked Plex item's poster as the main image"
            onClick={c.onUsePlexPoster}
          >
            <Tv className="size-4" />
            {c.plexPosterPending ? "Importing…" : "Use Plex poster"}
          </Button>
        )
        : null}
      {c.canUseIsbnCover
        ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={c.isbnCoverPending}
            title="Look up the bookmark's ISBN/ASIN and use its cover as the main image"
            onClick={c.onUseIsbnCover}
          >
            <BookImage className="size-4" />
            {c.isbnCoverPending ? "Importing…" : "Pull cover from ISBN"}
          </Button>
        )
        : null}
      {c.mutationError
        ? <p className="mt-2 w-full text-sm text-destructive">{c.mutationError.message}</p>
        : null}
    </div>
  );
}

/** Manage the images for an existing bookmark: keep/remove, pick the main one, and add or find more. */
export function BookmarkImageEditForm({
  bookmark,
}: BookmarkImageEditFormProps) {
  const c = useBookmarkImageEditForm(bookmark);

  return (
    <form
      className="space-y-4"
      onSubmit={c.onSubmit}
    >
      <BookmarkImagePicker
        key={c.imageFieldKey}
        existingImages={bookmark.images}
        candidates={c.candidates}
        pageUrl={bookmark.url ?? ""}
        defaultAuto={false}
        autoGrabError={bookmark.imageAutoGrabError ?? null}
        onChange={c.onImageChange}
      />
      <ImageActionButtons
        pageUrl={bookmark.url}
        c={c}
      />
      <BookmarkImageDisplayToggle
        value={c.displayPreference}
        onChange={c.onDisplayPreferenceChange}
        hasImage={bookmark.image !== null}
        hasScreenshot={bookmark.screenshot !== null}
        disabled={c.displayPreferencePending}
      />
      <BookmarkScreenshotSection
        screenshot={bookmark.screenshot}
        c={c}
      />
    </form>
  );
}
