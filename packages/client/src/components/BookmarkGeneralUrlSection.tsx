import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";
import type { Bookmark } from "@eesimple/types";

import { Brush } from "lucide-react";

import { BookmarkUrlCleanupBanner } from "./BookmarkUrlCleanupBanner";
import { UrlCleanupPanel } from "./BookmarkUrlCleanupPanel";
import { BookmarkUrlDuplicateWarnings } from "./BookmarkUrlDuplicateWarnings";

import { Button } from "@/components/ui/button";

type Ctrl = ReturnType<typeof useBookmarkGeneralForm>;

/** The URL field plus its cleanup banner/panel and duplicate warnings. */
export function BookmarkGeneralUrlSection({
  ctrl, bookmark,
}: { ctrl: Ctrl;
  bookmark: Bookmark; }) {
  const {
    form,
    websites,
    shortenerIgnoreList,
    customStripParams,
    urlShortener,
    urlCleanup,
    showUrlCleanup,
    setShowUrlCleanup,
    urlCleanupMode,
    setUrlCleanupMode,
    cleanupId,
    urlDuplicate,
    performUrlScan,
    undoUrlCleanup,
  } = ctrl;
  return (
    <>
      <form.AppField name="url">
        {field => (
          <field.TextField
            label="URL"
            type="url"
            onBlur={() => void performUrlScan()}
            action={(
              <Button
                type="button"
                variant={showUrlCleanup ? "secondary" : "ghost"}
                size="icon"
                title="URL cleanup"
                aria-label="Toggle URL cleanup"
                aria-expanded={showUrlCleanup}
                onClick={() => setShowUrlCleanup(prev => !prev)}
              >
                <Brush className="size-4" />
              </Button>
            )}
          />
        )}
      </form.AppField>

      <BookmarkUrlCleanupBanner
        urlCleanup={urlCleanup}
        urlShortener={urlShortener}
        onUndo={undoUrlCleanup}
      />

      {showUrlCleanup && (
        <form.Subscribe selector={state => state.values.url}>
          {url => (
            <UrlCleanupPanel
              url={url}
              cleanupId={cleanupId}
              mode={urlCleanupMode}
              onModeChange={setUrlCleanupMode}
              websites={websites ?? []}
              ignoreList={shortenerIgnoreList ?? []}
              customStripParams={customStripParams ?? []}
            />
          )}
        </form.Subscribe>
      )}

      <BookmarkUrlDuplicateWarnings
        urlDuplicate={urlDuplicate}
        currentBookmarkId={bookmark.id}
      />
    </>
  );
}
