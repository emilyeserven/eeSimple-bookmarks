import type { MediaSelection } from "./useBookmarkMediaField";
import type { Bookmark } from "@eesimple/types";

import { ChevronRight, ChevronsUpDown, Plus } from "lucide-react";

import { AddMediaTitleModal } from "./AddMediaTitleModal";
import { BookmarkKavitaDetailLink } from "./BookmarkKavitaField";
import { BookmarkPlexDetailLink } from "./BookmarkPlexField";
import { useBookmarkMediaField } from "./useBookmarkMediaField";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface BookmarkMediaFieldProps {
  bookmark: Bookmark;
  /** Persists the selection (or the empty selection to unlink) — the controller's immediate-save handler. */
  onSelect: (selection: MediaSelection) => void;
}

/**
 * Link a bookmark to an item from any of the seven Media Properties taxonomies (Books / Movies /
 * TV Shows / Episodes / Albums / Artists / Tracks) — replaces the old separate Book and Plex item
 * pickers; bookmarks associate with a taxonomy row rather than a raw Kavita/Plex item. Each taxonomy
 * is an independently collapsible section (a chevron toggle per heading); typing filters every
 * section locally and always surfaces matches even in a collapsed section. "Create title…" opens the
 * create dialog for any kind, with its own Kavita/Plex lookup. A bookmark still carrying a legacy
 * direct Kavita/Plex link (no matching taxonomy row) shows that link read-only below, so old links
 * stay reachable.
 */
export function BookmarkMediaField({
  bookmark,
  onSelect,
}: BookmarkMediaFieldProps) {
  const ctrl = useBookmarkMediaField(bookmark, onSelect);
  const noMatches = ctrl.query.trim().length > 0 && ctrl.sections.every(section => section.items.length === 0);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-media">Media</Label>
      <Popover
        open={ctrl.open}
        onOpenChange={ctrl.setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            id="bookmark-media"
            aria-expanded={ctrl.open}
            aria-label="Media"
            className="w-full justify-between font-normal"
          >
            <span
              className={cn("truncate", !ctrl.isLinked && `
                text-muted-foreground
              `)}
            >
              {ctrl.selectedLabel ?? "No media"}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="
            max-h-[70vh] w-(--radix-popover-trigger-width) space-y-2
            overflow-y-auto p-2
          "
          align="start"
        >
          <Input
            placeholder="Search books, movies, shows, episodes, albums, artists, tracks…"
            value={ctrl.query}
            onChange={event => ctrl.setQuery(event.target.value)}
          />

          {ctrl.sections.map(section => (
            <div key={section.kind}>
              <button
                type="button"
                className="
                  flex w-full items-center gap-1 rounded-sm px-1 py-1.5
                  text-left
                  hover:bg-accent hover:text-accent-foreground
                "
                onClick={section.onToggleCollapsed}
              >
                <ChevronRight
                  className={cn("size-3 shrink-0 transition-transform", !section.collapsed && `
                    rotate-90
                  `)}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {section.heading}
                  {" "}
                  (
                  {section.totalCount}
                  )
                </span>
              </button>
              {!section.collapsed && section.items.length > 0
                ? (
                  <ul className="space-y-1 pl-4">
                    {section.items.map(item => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="
                            w-full rounded-sm px-2 py-1 text-left text-sm
                            hover:bg-accent hover:text-accent-foreground
                          "
                          onClick={() => ctrl.selectItem(section.kind, item.id)}
                        >
                          {item.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
                : null}
            </div>
          ))}

          {noMatches
            ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                No matching items found.
              </p>
            )
            : null}

          <Separator />
          <button
            type="button"
            className="
              flex w-full items-center gap-2 rounded-sm p-2 text-sm font-medium
              hover:bg-accent hover:text-accent-foreground
            "
            onClick={() => {
              ctrl.setOpen(false);
              ctrl.setAddOpen(true);
            }}
          >
            <Plus className="size-4 shrink-0" />
            Create title…
          </button>
        </PopoverContent>
      </Popover>
      <AddMediaTitleModal
        open={ctrl.addOpen}
        onOpenChange={ctrl.setAddOpen}
        onCreated={ctrl.handleCreated}
      />
      {ctrl.showLegacyKavita
        ? (
          <p className="text-xs text-muted-foreground">
            Legacy Kavita link:
            {" "}
            <BookmarkKavitaDetailLink bookmark={bookmark} />
          </p>
        )
        : null}
      {ctrl.showLegacyPlex
        ? (
          <p className="text-xs text-muted-foreground">
            Legacy Plex link:
            {" "}
            <BookmarkPlexDetailLink bookmark={bookmark} />
          </p>
        )
        : null}
    </div>
  );
}
