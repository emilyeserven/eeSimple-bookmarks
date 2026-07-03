import type { PlexItemResult } from "@eesimple/types";

import { useState } from "react";

import { ChevronRight } from "lucide-react";

import { plexTypeLabel } from "../lib/plex";

import { cn } from "@/lib/utils";

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

export interface PlexResultsTreeProps {
  items: PlexItemResult[];
  onSelect: (item: PlexItemResult) => void;
}

/**
 * The search-hit list as a two-level collapsible tree (media type, then show/artist/library). Each
 * level defaults open; a chevron toggles it closed to shrink long result sets. Collapse state is
 * local to one search — the parent remounts this with a `key` per query so it resets on a new search.
 */
export function PlexResultsTree({
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
