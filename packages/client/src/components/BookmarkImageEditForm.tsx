import type { Bookmark } from "@eesimple/types";

import { BookImage, BookOpen, Search, Sparkles } from "lucide-react";

import { BookmarkImagePicker } from "./BookmarkImagePicker";
import { SCREENSHOT_SIZE_PRESETS } from "./screenshotSizePresets";
import { useBookmarkImageEditForm } from "./useBookmarkImageEditForm";

import { Button } from "@/components/ui/button";

interface BookmarkImageEditFormProps {
  bookmark: Bookmark;
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
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={c.isPending || c.isMutating}
        >
          {c.isPending || c.isMutating ? "Saving…" : "Save changes"}
        </Button>
        {bookmark.url
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
      <div className="space-y-2 border-t pt-4">
        <p className="text-sm font-medium">Page screenshot</p>
        <p className="text-xs text-muted-foreground">
          {bookmark.screenshot
            ? "A screenshot has been captured. It is used as the bookmark image when no other image exists."
            : "Take a screenshot of the page via Browserless. Used as a fallback image when no other image is set."}
        </p>
        {bookmark.screenshot
          ? (
            <img
              src={bookmark.screenshot.url}
              alt="Page screenshot"
              className="max-h-32 rounded-sm border object-cover"
            />
          )
          : null}
        <div className="flex flex-wrap items-center gap-2">
          <label
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            Wait
            <select
              className="
                rounded-sm border bg-background px-1.5 py-1 text-xs
                text-foreground
              "
              value={c.screenshotDelayMs}
              disabled={c.isMutating}
              onChange={e => c.setScreenshotDelayMs(Number(e.target.value))}
            >
              <option value={0}>None</option>
              <option value={2000}>2 s</option>
              <option value={5000}>5 s</option>
              <option value={10000}>10 s</option>
              <option value={30000}>30 s</option>
            </select>
          </label>
          <label
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            Size
            <select
              className="
                rounded-sm border bg-background px-1.5 py-1 text-xs
                text-foreground
              "
              value={`${c.screenshotWidth}x${c.screenshotHeight}`}
              disabled={c.isMutating}
              onChange={(e) => {
                const preset = SCREENSHOT_SIZE_PRESETS.find(p => `${p.width}x${p.height}` === e.target.value);
                if (preset) c.setScreenshotSize(preset.width, preset.height);
              }}
            >
              {SCREENSHOT_SIZE_PRESETS.map(preset => (
                <option
                  key={preset.label}
                  value={`${preset.width}x${preset.height}`}
                >
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            Scroll
            <select
              className="
                rounded-sm border bg-background px-1.5 py-1 text-xs
                text-foreground
              "
              value={c.screenshotScrollDistance}
              disabled={c.isMutating}
              onChange={e => c.setScreenshotScrollDistance(Number(e.target.value))}
            >
              <option value={0}>None</option>
              <option value={500}>500 px</option>
              <option value={1000}>1000 px</option>
              <option value={2000}>2000 px</option>
              <option value={5000}>5000 px</option>
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={c.isMutating}
            onClick={c.onTakeScreenshot}
          >
            {c.takeScreenshotPending ? "Capturing…" : bookmark.screenshot ? "Retake screenshot" : "Take screenshot"}
          </Button>
          {bookmark.screenshot
            ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={c.isMutating}
                onClick={c.onDeleteScreenshot}
              >
                {c.deleteScreenshotPending ? "Removing…" : "Remove screenshot"}
              </Button>
            )
            : null}
        </div>
      </div>
    </form>
  );
}
