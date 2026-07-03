import type { Bookmark, PlexItemResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ExternalLink, Loader2, Tv, X } from "lucide-react";

import { useConnectors } from "../hooks/useConnectors";
import { plexApi } from "../lib/api/plex";
import { plexItemUrl, plexTypeLabel } from "../lib/plex";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/** The Plex web-UI deep link for a linked bookmark, or `null` when the link can't be built. */
function linkedPlexUrl(
  bookmark: Bookmark,
  connectors: ReturnType<typeof useConnectors>["data"],
): string | null {
  if (bookmark.plexRatingKey === null) return null;
  const plex = connectors?.plex;
  if (!plex?.enabled || !plex.baseUrl || !plex.machineIdentifier) return null;
  return plexItemUrl(plex.baseUrl, plex.machineIdentifier, bookmark.plexRatingKey);
}

/**
 * The linked Plex item as a detail-view value: the item title, deep-linked into Plex's web UI when
 * the connector is enabled and the server's machineIdentifier is known. Returns `null` when the
 * bookmark isn't linked. Owns its `useConnectors()` call so the pure detail-section builders can
 * render it directly.
 */
export function BookmarkPlexDetailLink({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    data: connectors,
  } = useConnectors();
  if (bookmark.plexRatingKey === null) return null;
  const name = bookmark.plexItemTitle ?? `Item ${bookmark.plexRatingKey}`;
  const url = linkedPlexUrl(bookmark, connectors);
  if (!url) return <span>{name}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {name}
    </a>
  );
}

interface BookmarkPlexFieldProps {
  bookmark: Bookmark;
  /** Persists the selection (or `null` to unlink) — the controller's immediate-save handler. */
  onSelect: (selection: PlexItemResult | null) => void;
}

/** A leaf search hit's label within its group: title, plus the year when reported. */
function itemLabel(item: PlexItemResult): string {
  return item.year ? `${item.title} (${item.year})` : item.title;
}

/** A group of items sharing the same {@link PlexItemResult.groupTitle} within one media type. */
interface PlexLeafGroup {
  key: string;
  label: string;
  items: PlexItemResult[];
}

/** One media-type section of search results, in first-seen order. */
interface PlexTypeGroup {
  key: string;
  type: string;
  groups: PlexLeafGroup[];
  count: number;
}

/**
 * Builds a two-level collapse tree from flat search hits: media type (e.g. Movie, TV Show), then
 * `groupTitle` (the containing show/artist, or the library when there isn't one) — so items that
 * share the same context (e.g. two movies from the same Plex library) collapse into one subgroup.
 * Preserves first-seen order at both levels.
 */
function buildPlexTree(items: PlexItemResult[]): PlexTypeGroup[] {
  const typeGroups: PlexTypeGroup[] = [];
  for (const item of items) {
    let typeGroup = typeGroups.find(candidate => candidate.type === item.type);
    if (!typeGroup) {
      typeGroup = {
        key: item.type,
        type: item.type,
        groups: [],
        count: 0,
      };
      typeGroups.push(typeGroup);
    }
    typeGroup.count += 1;

    const label = item.groupTitle ?? "Other";
    let leafGroup = typeGroup.groups.find(candidate => candidate.label === label);
    if (!leafGroup) {
      leafGroup = {
        key: `${item.type}:${label}`,
        label,
        items: [],
      };
      typeGroup.groups.push(leafGroup);
    }
    leafGroup.items.push(item);
  }
  return typeGroups;
}

interface PlexResultsTreeProps {
  items: PlexItemResult[];
  onSelect: (item: PlexItemResult) => void;
}

/**
 * The search-hit list as a two-level collapsible tree (media type, then show/artist/library). Each
 * level defaults open; a chevron toggles it closed to shrink long result sets. Collapse state is
 * local to one search — the parent remounts this with a `key` per query so it resets on a new search.
 */
function PlexResultsTree({
  items, onSelect,
}: PlexResultsTreeProps) {
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-1 rounded-md border p-1">
      {buildPlexTree(items).map((typeGroup) => {
        const typeCollapsed = collapsedKeys.has(typeGroup.key);
        return (
          <div key={typeGroup.key}>
            <button
              type="button"
              className="
                flex w-full items-center gap-1 rounded-sm px-1 py-1.5 text-left
                hover:bg-accent hover:text-accent-foreground
              "
              onClick={() => toggle(typeGroup.key)}
            >
              <ChevronRight
                className={cn("size-3 shrink-0 transition-transform", !typeCollapsed && `
                  rotate-90
                `)}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {plexTypeLabel(typeGroup.type)} ({typeGroup.count})
              </span>
            </button>
            {typeCollapsed
              ? null
              : typeGroup.groups.map((leafGroup) => {
                const groupKey = `${typeGroup.key}:${leafGroup.key}`;
                const groupCollapsed = collapsedKeys.has(groupKey);
                const showGroupHeading = leafGroup.label !== plexTypeLabel(typeGroup.type);
                return (
                  <div
                    key={leafGroup.key}
                    className="pl-4"
                  >
                    {showGroupHeading
                      ? (
                        <button
                          type="button"
                          className="
                            flex w-full items-center gap-1 rounded-sm p-1
                            text-left
                            hover:bg-accent hover:text-accent-foreground
                          "
                          onClick={() => toggle(groupKey)}
                        >
                          <ChevronRight
                            className={cn(
                              "size-3 shrink-0 transition-transform",
                              !groupCollapsed && "rotate-90",
                            )}
                          />
                          <span
                            className="truncate text-xs text-muted-foreground"
                          >
                            {leafGroup.label}
                          </span>
                        </button>
                      )
                      : null}
                    {showGroupHeading && groupCollapsed
                      ? null
                      : (
                        <ul className="space-y-1">
                          {leafGroup.items.map(item => (
                            <li key={`${item.type}:${item.ratingKey}`}>
                              <button
                                type="button"
                                className={cn(
                                  `
                                    w-full rounded-sm px-2 py-1 text-left
                                    text-sm
                                  `,
                                  "hover:bg-accent hover:text-accent-foreground",
                                  showGroupHeading && "pl-6",
                                )}
                                onClick={() => onSelect(item)}
                              >
                                {itemLabel(item)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Link a bookmark to an item on the connected Plex server. Renders nothing when the Plex connector
 * is unconfigured. Unlinked, it offers a debounced item search (proxied through the middleware so the
 * token stays server-side); linked, it shows the item title with a deep link into Plex's web UI and a
 * clear button. Selection and clearing save immediately (like Tags), outside the tab's Save-changes
 * submit.
 */
export function BookmarkPlexField({
  bookmark,
  onSelect,
}: BookmarkPlexFieldProps) {
  const {
    data: connectors,
  } = useConnectors();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const trimmedQuery = debouncedQuery.trim();
  const search = useQuery({
    queryKey: ["plex-item-search", trimmedQuery],
    queryFn: () => plexApi.searchItems(trimmedQuery),
    enabled: Boolean(connectors?.plex.enabled) && trimmedQuery.length >= MIN_QUERY_LENGTH,
  });

  if (!connectors?.plex.enabled) return null;

  const linked = bookmark.plexRatingKey !== null;
  const linkedUrl = linkedPlexUrl(bookmark, connectors);
  const linkedName = bookmark.plexItemTitle ?? `Item ${bookmark.plexRatingKey}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-plex-item">Plex item</Label>
      {linked
        ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Tv className="size-4 shrink-0 text-muted-foreground" />
            {linkedUrl
              ? (
                <a
                  href={linkedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    flex min-w-0 items-center gap-1 text-sm font-medium
                    underline-offset-2
                    hover:underline
                  "
                >
                  <span className="truncate">{linkedName}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )
              : (
                <span className="truncate text-sm font-medium">{linkedName}</span>
              )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto size-6 shrink-0"
              aria-label="Unlink Plex item"
              onClick={() => onSelect(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
        : (
          <>
            <div className="relative">
              <Input
                id="bookmark-plex-item"
                placeholder="Search your Plex libraries…"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              {search.isFetching
                ? (
                  <Loader2
                    className="
                      absolute top-1/2 right-3 size-4 -translate-y-1/2
                      animate-spin text-muted-foreground
                    "
                  />
                )
                : null}
            </div>
            {search.isError
              ? <p className="text-xs text-destructive">{search.error.message}</p>
              : null}
            {search.isSuccess && search.data.length === 0
              ? <p className="text-xs text-muted-foreground">No matching items found.</p>
              : null}
            {search.isSuccess && search.data.length > 0
              ? (
                <PlexResultsTree
                  key={trimmedQuery}
                  items={search.data}
                  onSelect={(item) => {
                    onSelect(item);
                    setQuery("");
                  }}
                />
              )
              : null}
            <p className="text-xs text-muted-foreground">
              Link this bookmark to a movie, show, or track on your Plex server.
            </p>
          </>
        )}
    </div>
  );
}
