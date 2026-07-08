import type { BookmarkImageEditFormController } from "./useBookmarkImageEditForm";
import type { Bookmark } from "@eesimple/types";

import { BookImage, BookOpen, Search, Sparkles, Tv } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkImageDisplayToggle } from "./BookmarkImageDisplayToggle";
import { BookmarkImageEditFormProvider, useBookmarkImageEditFormContext } from "./BookmarkImageEditFormContext";
import { BookmarkImagePicker } from "./BookmarkImagePicker";
import { BookmarkScreenshotSection } from "./BookmarkScreenshotSection";

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
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="submit"
        size="sm"
        disabled={c.isPending || c.isMutating}
      >
        {c.isPending || c.isMutating ? t("Saving…") : t("Save changes")}
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
              {c.isScanning ? t("Finding…") : t("Find images on page")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={c.getPageImagePending}
              title={t("Fetch the page's preview image (og:image)")}
              onClick={c.onGetPageImage}
            >
              <Sparkles className="size-4" />
              {c.getPageImagePending ? t("Fetching…") : t("Get page image")}
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
            title={t("Import the linked Kavita series' cover as the main image")}
            onClick={c.onUseKavitaCover}
          >
            <BookOpen className="size-4" />
            {c.kavitaCoverPending ? t("Importing…") : t("Use Kavita cover")}
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
            title={t("Import the linked Plex item's poster as the main image")}
            onClick={c.onUsePlexPoster}
          >
            <Tv className="size-4" />
            {c.plexPosterPending ? t("Importing…") : t("Use Plex poster")}
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
            title={t("Look up the bookmark's ISBN/ASIN and use its cover as the main image")}
            onClick={c.onUseIsbnCover}
          >
            <BookImage className="size-4" />
            {c.isbnCoverPending ? t("Importing…") : t("Pull cover from ISBN")}
          </Button>
        )
        : null}
      {c.mutationError
        ? <p className="mt-2 w-full text-sm text-destructive">{c.mutationError.message}</p>
        : null}
    </div>
  );
}

/**
 * The image picker — keep/remove, pick the main image, add or find more — as its own placeable field.
 * View renders the read-only gallery (see `bookmark.tsx`); this is the **edit** half, reading the shared
 * image controller from context.
 */
export function BookmarkImagePickerEditField({
  bookmark,
}: BookmarkImageEditFormProps) {
  const c = useBookmarkImageEditFormContext();
  return (
    <BookmarkImagePicker
      key={c.imageFieldKey}
      existingImages={bookmark.images}
      candidates={c.candidates}
      pageUrl={bookmark.url ?? ""}
      defaultAuto={false}
      autoGrabError={bookmark.imageAutoGrabError ?? null}
      onChange={c.onImageChange}
    />
  );
}

/**
 * The Save + source-import action buttons, as their own placeable **edit** field. Wrapped in a `<form>`
 * so the Save button's `type="submit"` still fires the controller's staged-intent persist (the intent
 * is staged by the picker field into the same shared controller).
 */
export function BookmarkImageActionsField({
  bookmark,
}: BookmarkImageEditFormProps) {
  const c = useBookmarkImageEditFormContext();
  return (
    <form onSubmit={c.onSubmit}>
      <ImageActionButtons
        pageUrl={bookmark.url}
        c={c}
      />
    </form>
  );
}

/** The cover-image display toggle (auto / image / screenshot), as its own placeable **edit** field. */
export function BookmarkImageDisplayField({
  bookmark,
}: BookmarkImageEditFormProps) {
  const c = useBookmarkImageEditFormContext();
  return (
    <BookmarkImageDisplayToggle
      value={c.displayPreference}
      onChange={c.onDisplayPreferenceChange}
      hasImage={bookmark.image !== null}
      hasScreenshot={bookmark.screenshot !== null}
      disabled={c.displayPreferencePending}
    />
  );
}

/** The page-screenshot capture section, as its own placeable **edit** field. */
export function BookmarkScreenshotField({
  bookmark,
}: BookmarkImageEditFormProps) {
  const c = useBookmarkImageEditFormContext();
  return (
    <BookmarkScreenshotSection
      screenshot={bookmark.screenshot}
      c={c}
    />
  );
}

/**
 * Manage the images for an existing bookmark. Recomposed from the four placeable Image-tab fields
 * (picker / actions / display toggle / screenshot) inside the shared `BookmarkImageEditFormProvider`,
 * so its story stays unchanged while each field is independently placeable via Page Layouts.
 */
export function BookmarkImageEditForm({
  bookmark,
}: BookmarkImageEditFormProps) {
  return (
    <BookmarkImageEditFormProvider bookmark={bookmark}>
      <div className="space-y-4">
        <BookmarkImagePickerEditField bookmark={bookmark} />
        <BookmarkImageActionsField bookmark={bookmark} />
        <BookmarkImageDisplayField bookmark={bookmark} />
        <BookmarkScreenshotField bookmark={bookmark} />
      </div>
    </BookmarkImageEditFormProvider>
  );
}
