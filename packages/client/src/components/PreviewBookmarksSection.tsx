import type {
  Bookmark,
  ConditionInput,
  ConditionTree,
  TagNode,
} from "@eesimple/types";

import { useMemo, useState } from "react";

import { buildTagDescendants, evaluateConditions } from "@eesimple/types";

import { useBookmarks } from "../hooks/useBookmarks";
import { flattenTree } from "../lib/tagTree";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PreviewBookmarksSectionProps {
  conditions: ConditionTree;
  tagTree: TagNode[];
}

function toConditionInput(bookmark: Bookmark): ConditionInput {
  return {
    url: bookmark.url,
    title: bookmark.title,
    categoryId: bookmark.categoryId,
    tagIds: new Set(bookmark.tags.map(t => t.id)),
    youtubeChannelId: bookmark.youtubeChannel?.id ?? null,
    numberValues: new Map(bookmark.numberValues.map(v => [v.propertyId, v.value])),
    booleanValues: new Map(bookmark.booleanValues.map(v => [v.propertyId, v.value])),
    dateTimeValues: new Map(bookmark.dateTimeValues.map(v => [v.propertyId, v.value])),
  };
}

/** Test which existing bookmarks match a condition tree: a "search all" pass plus a live name check. */
export function PreviewBookmarksSection({
  conditions, tagTree,
}: PreviewBookmarksSectionProps) {
  const [searched, setSearched] = useState(false);
  const [matchingBookmarks, setMatchingBookmarks] = useState<Bookmark[]>([]);
  const [checkQuery, setCheckQuery] = useState("");

  const {
    data: allBookmarks = [],
  } = useBookmarks();

  const tagDescendants = useMemo(
    () => buildTagDescendants(flattenTree(tagTree).map(({
      node,
    }) => node)),
    [tagTree],
  );

  const handleSearch = () => {
    const matches = allBookmarks.filter(bookmark =>
      evaluateConditions(conditions, toConditionInput(bookmark), {
        tagDescendants,
      }));
    setMatchingBookmarks(matches.slice(0, 5));
    setSearched(true);
  };

  const checkedBookmarks = useMemo(() => {
    if (!checkQuery.trim()) return [];
    const q = checkQuery.toLowerCase();
    return allBookmarks
      .filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
      .slice(0, 5);
  }, [allBookmarks, checkQuery]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSearch}
      >
        Search
      </Button>
      {searched && (
        <div className="space-y-1">
          {matchingBookmarks.length === 0
            ? <p className="text-sm text-muted-foreground">No bookmarks matched.</p>
            : matchingBookmarks.map(bookmark => (
              <BookmarkPreviewRow
                key={bookmark.id}
                bookmark={bookmark}
                matches
              />
            ))}
        </div>
      )}
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Search bookmarks to check…"
          value={checkQuery}
          onChange={e => setCheckQuery(e.target.value)}
        />
        {checkQuery.trim() && (
          <div className="space-y-1">
            {checkedBookmarks.length === 0
              ? <p className="text-sm text-muted-foreground">No bookmarks found.</p>
              : checkedBookmarks.map((bookmark) => {
                const matches = evaluateConditions(conditions, toConditionInput(bookmark), {
                  tagDescendants,
                });
                return (
                  <BookmarkPreviewRow
                    key={bookmark.id}
                    bookmark={bookmark}
                    matches={matches}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

interface BookmarkPreviewRowProps {
  bookmark: Bookmark;
  matches: boolean;
}

function BookmarkPreviewRow({
  bookmark, matches,
}: BookmarkPreviewRowProps) {
  return (
    <div
      className="
        flex items-start justify-between gap-2 rounded-md border px-3 py-2
      "
    >
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium">{bookmark.title}</p>
        <p className="truncate text-xs text-muted-foreground">{bookmark.url}</p>
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
        {matches ? "Matches" : "No match"}
      </Badge>
    </div>
  );
}
