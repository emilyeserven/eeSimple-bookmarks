import { Link } from "@tanstack/react-router";
import { Globe, Trash2 } from "lucide-react";

import {
  useDeleteSavedFilter,
  useSavedFilters,
  useUpdateSavedFilter,
} from "../hooks/useSavedFilters";
import { summarizeBookmarkSearch } from "../lib/bookmarkSearch";
import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Lists all saved filters with delete + "viewable online" controls; used on Settings → Saved Filters and /saved-filters. */
export function SavedFiltersManager() {
  const {
    data: filters = [], isLoading, error,
  } = useSavedFilters();
  const deleteMutation = useDeleteSavedFilter();
  const updateMutation = useUpdateSavedFilter();

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
      {filters.map((filter) => {
        const checkboxId = `viewable-online-${filter.id}`;
        const nameContent = (
          <>
            <p className="truncate font-medium">{filter.name}</p>
            {filter.description
              ? <p className="truncate text-sm text-muted-foreground">{filter.description}</p>
              : null}
            <p className="text-xs text-muted-foreground">
              {summarizeBookmarkSearch(filter.filters)}
            </p>
          </>
        );
        return (
          <RowCard
            key={filter.id}
            className="flex items-start justify-between gap-4 p-4"
          >
            <div className="min-w-0 space-y-2">
              <div className="space-y-1">
                {filter.slug
                  ? (
                    <Link
                      to="/saved-filters/$filterSlug"
                      params={{
                        filterSlug: filter.slug,
                      }}
                      className="
                        block
                        hover:underline
                      "
                    >
                      {nameContent}
                    </Link>
                  )
                  : nameContent}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={checkboxId}
                  checked={filter.viewableOnline}
                  disabled={updateMutation.isPending}
                  onCheckedChange={(checked) => {
                    const viewableOnline = checked === true;
                    updateMutation.mutate(
                      {
                        id: filter.id,
                        input: {
                          viewableOnline,
                        },
                      },
                      {
                        onSuccess: () =>
                          notifySuccess(
                            viewableOnline
                              ? `"${filter.name}" is now a sidebar shortcut`
                              : `"${filter.name}" is no longer a sidebar shortcut`,
                          ),
                      },
                    );
                  }}
                />
                <Label
                  htmlFor={checkboxId}
                  className="
                    flex items-center gap-1.5 text-sm font-normal
                    text-muted-foreground
                  "
                >
                  <Globe className="size-3.5" />
                  Viewable online
                </Label>
              </div>
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
        );
      })}
    </div>
  );
}
