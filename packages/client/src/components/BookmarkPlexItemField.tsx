import type { PlexItemSelection } from "./useBookmarkPlexItemField";
import type { Bookmark } from "@eesimple/types";

import { ChevronsUpDown, Loader2, Plus, X } from "lucide-react";

import { AddPlexTitleModal } from "./AddPlexTitleModal";
import { PlexResultsTree } from "./PlexResultsTree";
import { useBookmarkPlexItemField } from "./useBookmarkPlexItemField";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface BookmarkPlexItemFieldProps {
  bookmark: Bookmark;
  /** Persists the selection (or the empty selection to unlink) — the controller's immediate-save handler. */
  onSelect: (selection: PlexItemSelection) => void;
}

/**
 * Link a bookmark to a movie/show from the Movies / TV Shows taxonomies, or directly to any other
 * Plex item (season, episode, artist, album, track) via the legacy `plexRatingKey`/`plexItemType`/
 * `plexItemTitle` columns — those kinds have no taxonomy of their own. One combobox covers both:
 * typing filters the already-curated Movies/TV Shows locally (instant), and once the query is long
 * enough it also live-searches the connected Plex server across every item type and appends the
 * results below as a collapsible tree grouped by media type. "Create a Plex title…" still opens the
 * movie/TV-show create dialog for curating a new title into the taxonomy.
 */
export function BookmarkPlexItemField({
  bookmark,
  onSelect,
}: BookmarkPlexItemFieldProps) {
  const ctrl = useBookmarkPlexItemField(bookmark, onSelect);
  const noBrowseMatches = ctrl.filteredMovies.length === 0 && ctrl.filteredTvShows.length === 0;
  const noLiveMatches = ctrl.liveSearchSettled && (ctrl.liveSearch.data?.length ?? 0) === 0;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-plex-item">Plex item</Label>
      <Popover
        open={ctrl.open}
        onOpenChange={ctrl.setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            id="bookmark-plex-item"
            aria-expanded={ctrl.open}
            aria-label="Plex item"
            className="w-full justify-between font-normal"
          >
            <span
              className={cn("truncate", !ctrl.isLinked && `
                text-muted-foreground
              `)}
            >
              {ctrl.selectedLabel ?? "No Plex item"}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) space-y-2 p-2"
          align="start"
        >
          <div className="relative">
            <Input
              placeholder="Search movies, TV shows, episodes, tracks…"
              value={ctrl.query}
              onChange={event => ctrl.setQuery(event.target.value)}
            />
            {ctrl.liveSearch.isFetching
              ? (
                <Loader2
                  className="
                    absolute top-1/2 right-2 size-4 -translate-y-1/2
                    animate-spin text-muted-foreground
                  "
                />
              )
              : null}
          </div>

          {ctrl.isLinked
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={ctrl.unlink}
              >
                <X className="size-4" />
                Unlink
              </Button>
            )
            : null}

          {ctrl.filteredMovies.length > 0
            ? (
              <div>
                <p
                  className="
                    px-2 py-1.5 text-xs font-medium text-muted-foreground
                  "
                >Movies
                </p>
                <ul className="space-y-1">
                  {ctrl.filteredMovies.map(movie => (
                    <li key={movie.id}>
                      <button
                        type="button"
                        className="
                          w-full rounded-sm px-2 py-1 text-left text-sm
                          hover:bg-accent hover:text-accent-foreground
                        "
                        onClick={() => ctrl.selectTitle("movie", movie.id)}
                      >
                        {movie.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
            : null}

          {ctrl.filteredTvShows.length > 0
            ? (
              <div>
                <p
                  className="
                    px-2 py-1.5 text-xs font-medium text-muted-foreground
                  "
                >TV Shows
                </p>
                <ul className="space-y-1">
                  {ctrl.filteredTvShows.map(show => (
                    <li key={show.id}>
                      <button
                        type="button"
                        className="
                          w-full rounded-sm px-2 py-1 text-left text-sm
                          hover:bg-accent hover:text-accent-foreground
                        "
                        onClick={() => ctrl.selectTitle("show", show.id)}
                      >
                        {show.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
            : null}

          {ctrl.liveSearch.isError
            ? <p className="text-xs text-destructive">{ctrl.liveSearch.error.message}</p>
            : null}

          {ctrl.liveSearch.isSuccess && ctrl.liveSearch.data.length > 0
            ? (
              <div>
                <p
                  className="
                    px-2 py-1.5 text-xs font-medium text-muted-foreground
                  "
                >More on Plex
                </p>
                <PlexResultsTree
                  key={ctrl.trimmedQuery}
                  items={ctrl.liveSearch.data}
                  onSelect={ctrl.selectItem}
                />
              </div>
            )
            : null}

          {noBrowseMatches && (ctrl.query.trim().length === 0 || noLiveMatches)
            ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {ctrl.query.trim().length === 0 ? "No movies or TV shows yet." : "No matching items found."}
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
            Create a Plex title…
          </button>
        </PopoverContent>
      </Popover>
      <AddPlexTitleModal
        open={ctrl.addOpen}
        onOpenChange={ctrl.setAddOpen}
        onCreated={created => ctrl.createTitle(created.kind, created.id)}
      />
    </div>
  );
}
