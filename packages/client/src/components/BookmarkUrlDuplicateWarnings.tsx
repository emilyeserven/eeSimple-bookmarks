import type { BookmarkUrlDuplicateResult } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();
  const exactMatch = urlDuplicate?.exactMatch ?? null;
  const pathMatch = urlDuplicate?.pathMatch ?? null;
  const identityMatches = (urlDuplicate?.identityMatches ?? [])
    .filter(match => !currentBookmarkId || match.id !== currentBookmarkId);

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
              {t("A bookmark with this exact URL already exists:")}
              {" "}
              <strong>{exactMatch.title}</strong>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.open(exactMatch.url ?? undefined, "_blank")}
            >
              {t("Open in new tab")}
            </Button>
          </div>
          {!currentBookmarkId && (
            <p className="text-xs text-muted-foreground">
              {t("Change the URL above to save a new bookmark.")}
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
              {t("A bookmark with a similar URL already exists:")}
              {" "}
              <strong>{pathMatch.title}</strong>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.open(pathMatch.url ?? undefined, "_blank")}
            >
              {t("Open in new tab")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("You can still save — the query parameters differ.")}
          </p>
        </div>
      )}
      {identityMatches.length > 0 && (
        <div
          className="
            flex flex-col gap-2 rounded-md border border-amber-500/50
            bg-amber-500/10 px-3 py-2 text-sm
          "
        >
          <span>
            {t("A bookmark already uses this Plex, Kavita, ISBN, or podcast-feed item:")}
          </span>
          {identityMatches.map(match => (
            <div
              key={match.id}
              className="flex items-center justify-between gap-2"
            >
              <strong>{match.title}</strong>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => window.open(match.url ?? undefined, "_blank")}
              >
                {t("Open in new tab")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
