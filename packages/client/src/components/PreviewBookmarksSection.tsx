import type {
  AutofillPreviewEntry,
  ConditionTree,
} from "@eesimple/types";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { useAutofillPreview } from "../hooks/useAutofill";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PreviewBookmarksSectionProps {
  conditions: ConditionTree;
}

/** Test which existing bookmarks match a condition tree: a "search all" pass plus a live name check. */
export function PreviewBookmarksSection({
  conditions,
}: PreviewBookmarksSectionProps) {
  const {
    t,
  } = useTranslation();
  const [searched, setSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<AutofillPreviewEntry[]>([]);
  const [checkQuery, setCheckQuery] = useState("");
  const [checkResults, setCheckResults] = useState<AutofillPreviewEntry[]>([]);

  // `mutate` is a stable reference across renders, so it's safe in the effect deps below (the whole
  // mutation object is not — its identity changes after each call and would re-fire the effect).
  const {
    mutate: runSearch, isPending: searchPending,
  } = useAutofillPreview();
  const {
    mutate: runCheck,
  } = useAutofillPreview();

  const handleSearch = () => {
    setSearched(true);
    runSearch({
      conditions,
    }, {
      onSuccess: result => setSearchResults(result.entries),
    });
  };

  // Debounce the name check: the matching/grouping now happens server-side, so avoid a request per
  // keystroke.
  useEffect(() => {
    const query = checkQuery.trim();
    if (!query) {
      setCheckResults([]);
      return;
    }
    const handle = setTimeout(() => {
      runCheck({
        conditions,
        query,
      }, {
        onSuccess: result => setCheckResults(result.entries),
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [checkQuery, conditions, runCheck]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSearch}
        disabled={searchPending}
      >
        {t("Search")}
      </Button>
      {searched && (
        <div className="space-y-1">
          {searchResults.length === 0
            ? <p className="text-sm text-muted-foreground">{t("No bookmarks matched.")}</p>
            : searchResults.map(entry => (
              <BookmarkPreviewRow
                key={entry.bookmark.id}
                title={entry.bookmark.title}
                url={entry.bookmark.url ?? ""}
                matches={entry.matches}
              />
            ))}
        </div>
      )}
      <div className="space-y-2">
        <Input
          type="text"
          placeholder={t("Search bookmarks or category to check…")}
          value={checkQuery}
          onChange={e => setCheckQuery(e.target.value)}
        />
        {checkQuery.trim() && (
          <div className="space-y-1">
            {checkResults.length === 0
              ? <p className="text-sm text-muted-foreground">{t("No bookmarks found.")}</p>
              : checkResults.map(entry => (
                <BookmarkPreviewRow
                  key={entry.bookmark.id}
                  title={entry.bookmark.title}
                  url={entry.bookmark.url ?? ""}
                  matches={entry.matches}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface BookmarkPreviewRowProps {
  title: string;
  url: string;
  matches: boolean;
}

function BookmarkPreviewRow({
  title, url, matches,
}: BookmarkPreviewRowProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div
      className="
        flex items-start justify-between gap-2 rounded-md border px-3 py-2
      "
    >
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{url}</p>
      </div>
      <Badge
        variant={matches ? "default" : "outline"}
        className={matches
          ? `
            shrink-0 bg-green-600
            hover:bg-green-600
          `
          : "shrink-0 text-destructive"}
      >
        {matches ? t("Matches") : t("No match")}
      </Badge>
    </div>
  );
}
