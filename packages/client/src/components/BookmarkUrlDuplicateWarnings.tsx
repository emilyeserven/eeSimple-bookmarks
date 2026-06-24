import type { BookmarkUrlDuplicateResult } from "@eesimple/types";

import { Button } from "@/components/ui/button";

interface BookmarkUrlDuplicateWarningsProps {
  urlDuplicate?: BookmarkUrlDuplicateResult | null;
  /** When provided, warnings are suppressed if the duplicate is this bookmark (edit flow). */
  currentBookmarkId?: string;
}

/** Exact-match and path-match duplicate URL warnings. */
export function BookmarkUrlDuplicateWarnings({
  urlDuplicate,
  currentBookmarkId,
}: BookmarkUrlDuplicateWarningsProps) {
  const exactMatch = urlDuplicate?.exactMatch ?? null;
  const pathMatch = urlDuplicate?.pathMatch ?? null;

  const showExact = !!exactMatch && (!currentBookmarkId || exactMatch.id !== currentBookmarkId);
  const showPath = !showExact
    && !!pathMatch
    && (!currentBookmarkId || pathMatch.id !== currentBookmarkId);

  return (
    <>
      {showExact && (
        <div
          className="
            flex flex-col gap-2 rounded-md border border-destructive
            bg-destructive/10 px-3 py-2 text-sm
          "
        >
          <div className="flex items-center justify-between gap-2">
            <span>
              A bookmark with this exact URL already exists:
              {" "}
              <strong>{exactMatch.title}</strong>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.open(exactMatch.url ?? undefined, "_blank")}
            >
              Open in new tab
            </Button>
          </div>
          {!currentBookmarkId && (
            <p className="text-xs text-muted-foreground">
              Change the URL above to save a new bookmark.
            </p>
          )}
        </div>
      )}
      {showPath && (
        <div
          className="
            flex flex-col gap-2 rounded-md border border-amber-500/50
            bg-amber-500/10 px-3 py-2 text-sm
          "
        >
          <div className="flex items-center justify-between gap-2">
            <span>
              A bookmark with a similar URL already exists:
              {" "}
              <strong>{pathMatch.title}</strong>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.open(pathMatch.url ?? undefined, "_blank")}
            >
              Open in new tab
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You can still save — the query parameters differ.
          </p>
        </div>
      )}
    </>
  );
}
