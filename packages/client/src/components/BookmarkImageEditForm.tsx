import type { Bookmark } from "@eesimple/types";

import { BookmarkImageField } from "./BookmarkImageField";
import { useBookmarkImageEditForm } from "./useBookmarkImageEditForm";

import { Button } from "@/components/ui/button";

interface BookmarkImageEditFormProps {
  bookmark: Bookmark;
}

/** Manage the image for an existing bookmark. */
export function BookmarkImageEditForm({
  bookmark,
}: BookmarkImageEditFormProps) {
  const c = useBookmarkImageEditForm(bookmark);

  return (
    <form
      className="space-y-4"
      onSubmit={c.onSubmit}
    >
      <BookmarkImageField
        key={c.imageFieldKey}
        existingImageUrl={bookmark.image?.url ?? null}
        pageUrl={bookmark.url ?? ""}
        defaultAuto={false}
        autoGrabError={bookmark.imageAutoGrabError ?? null}
        onChange={c.onImageChange}
      />
      <div>
        <Button
          type="submit"
          size="sm"
          disabled={c.isPending || c.isMutating}
        >
          {c.isPending || c.isMutating ? "Saving…" : "Save changes"}
        </Button>
        {c.mutationError
          ? <p className="mt-2 text-sm text-destructive">{c.mutationError.message}</p>
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
