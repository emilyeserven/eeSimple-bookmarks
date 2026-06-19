import { Trash2 } from "lucide-react";

import { useDeleteSavedFilter, useSavedFilters } from "../hooks/useSavedFilters";
import { summarizeBookmarkSearch } from "../lib/bookmarkSearch";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";

/** Lists all saved filters with delete action; used on the Settings → Saved Filters page. */
export function SavedFiltersManager() {
  const {
    data: filters = [], isLoading, error,
  } = useSavedFilters();
  const deleteMutation = useDeleteSavedFilter();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;
  if (filters.length === 0) {
    return (
      <p className="text-muted-foreground">
        No saved filters yet. Set filters on the Bookmarks page and click &ldquo;Save&rdquo; to create one.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {filters.map(filter => (
        <RowCard
          key={filter.id}
          className="flex items-start justify-between gap-4 p-4"
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{filter.name}</p>
            {filter.description
              ? <p className="truncate text-sm text-muted-foreground">{filter.description}</p>
              : null}
            <p className="text-xs text-muted-foreground">
              {summarizeBookmarkSearch(filter.filters)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="
              shrink-0 text-muted-foreground
              hover:text-destructive
            "
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(filter.id)}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete {filter.name}</span>
          </Button>
        </RowCard>
      ))}
    </div>
  );
}
