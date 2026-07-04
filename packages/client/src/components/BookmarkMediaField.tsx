import type { MediaSelection } from "./useBookmarkMediaField";
import type { Bookmark } from "@eesimple/types";

import { ChevronRight, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  /** The current media selection (the six FK values). Derived from the bookmark on edit, or from form state on create. */
  value: MediaSelection;
  /** Persists the selection (or the empty selection to unlink) — an immediate-save handler on edit, a form write on create. */
  onSelect: (selection: MediaSelection) => void;
  /** The persisted bookmark, when editing — enables the legacy Kavita/Plex read-only links. Absent on create. */
  bookmark?: Bookmark | null;
}

/**
 * Link a bookmark to an item from any of the six Media Properties taxonomies (Books / Movies /
 * TV Shows / Episodes / Albums / Tracks) — replaces the old separate Book and Plex item
 * pickers; bookmarks associate with a taxonomy row rather than a raw Kavita/Plex item. Each taxonomy
 * is an independently collapsible section (a chevron toggle per heading); typing filters every
 * section locally and always surfaces matches even in a collapsed section. "Create title…" opens the
 * create dialog for any kind, with its own Kavita/Plex lookup. A bookmark still carrying a legacy
 * direct Kavita/Plex link (no matching taxonomy row) shows that link read-only below, so old links
 * stay reachable.
 *
 * Selection-driven (a `value` + `onSelect`), so it serves both the edit surface (auto-save each
 * change) and the create form (write the six FK form fields); the legacy links only render when the
 * optional persisted `bookmark` is supplied.
 */
export function BookmarkMediaField({
  value,
  onSelect,
  bookmark,
}: BookmarkMediaFieldProps) {
  const {
    t,
  } = useTranslation();
  const ctrl = useBookmarkMediaField(value, onSelect, bookmark);
  const noMatches = ctrl.query.trim().length > 0 && ctrl.sections.every(section => section.items.length === 0);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-media">{t("Media")}</Label>
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
            aria-label={t("Media")}
            className="w-full justify-between font-normal"
          >
            <span
              className={cn("truncate", !ctrl.isLinked && `
                text-muted-foreground
              `)}
            >
              {ctrl.selectedLabel ?? t("No media")}
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
            placeholder={t("Search books, movies, shows, episodes, albums, tracks…")}
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
                {t("No matching items found.")}
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
            {t("Create title…")}
          </button>
        </PopoverContent>
      </Popover>
      <AddMediaTitleModal
        open={ctrl.addOpen}
        onOpenChange={ctrl.setAddOpen}
        onCreated={ctrl.handleCreated}
      />
      {ctrl.showLegacyKavita && bookmark
        ? (
          <p className="text-xs text-muted-foreground">
            {t("Legacy Kavita link:")}
            {" "}
            <BookmarkKavitaDetailLink bookmark={bookmark} />
          </p>
        )
        : null}
      {ctrl.showLegacyPlex && bookmark
        ? (
          <p className="text-xs text-muted-foreground">
            {t("Legacy Plex link:")}
            {" "}
            <BookmarkPlexDetailLink bookmark={bookmark} />
          </p>
        )
        : null}
    </div>
  );
}
