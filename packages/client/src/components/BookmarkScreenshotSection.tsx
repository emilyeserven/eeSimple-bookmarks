import type { BookmarkImageEditFormController } from "./useBookmarkImageEditForm";
import type { Bookmark } from "@eesimple/types";

import { SCREENSHOT_SIZE_PRESETS } from "./screenshotSizePresets";

import { Button } from "@/components/ui/button";

const SELECT_CLASS = `
  rounded-sm border bg-background px-1.5 py-1 text-xs
  text-foreground
`;

/**
 * The "Page screenshot" block of the image edit tab: capture settings (wait / viewport size /
 * scroll), the current capture preview, and the take/retake/remove actions.
 */
export function BookmarkScreenshotSection({
  screenshot,
  c,
}: {
  screenshot: Bookmark["screenshot"];
  c: BookmarkImageEditFormController;
}) {
  return (
    <div className="space-y-2 border-t pt-4">
      <p className="text-sm font-medium">Page screenshot</p>
      <p className="text-xs text-muted-foreground">
        {screenshot
          ? "A screenshot has been captured. It is used as the bookmark image when no other image exists."
          : "Take a screenshot of the page via Browserless. Used as a fallback image when no other image is set."}
      </p>
      {screenshot
        ? (
          <img
            src={screenshot.url}
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
            className={SELECT_CLASS}
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
            className={SELECT_CLASS}
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
            className={SELECT_CLASS}
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
          {c.takeScreenshotPending ? "Capturing…" : screenshot ? "Retake screenshot" : "Take screenshot"}
        </Button>
        {screenshot
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
  );
}
