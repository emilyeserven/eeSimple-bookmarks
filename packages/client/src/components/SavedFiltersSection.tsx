import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useState } from "react";

import { Bookmark, ChevronDown } from "lucide-react";

import { InlineCreateModal } from "./InlineCreateModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useCreateSavedFilter, useSavedFilters } from "../hooks/useSavedFilters";
import { hasAnyActiveFilter, validateBookmarkSearch } from "../lib/bookmarkSearch";

import { Button } from "@/components/ui/button";

interface SavedFiltersSectionProps {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * Collapsible "Saved Filters" section for the filter sidebar and panel. Users can save the
 * current filter state under a name, and apply any saved filter with one click.
 */
export function SavedFiltersSection({
  search, onSearchChange,
}: SavedFiltersSectionProps) {
  const {
    data: savedFilters = [], isLoading,
  } = useSavedFilters();
  const createMutation = useCreateSavedFilter();
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const hasActive = hasAnyActiveFilter(search);

  if (!hasActive && savedFilters.length === 0 && !isLoading) return null;

  return (
    <>
      <Collapsible
        defaultOpen
        className="group/saved-filters space-y-3"
      >
        <div className="flex items-center justify-between">
          <CollapsibleTrigger
            className="
              flex items-center gap-1.5 text-sm font-semibold
              hover:text-foreground
            "
          >
            <ChevronDown
              className="
                size-3.5 shrink-0 transition-transform
                group-data-[state=open]/saved-filters:rotate-180
              "
            />
            Saved Filters
          </CollapsibleTrigger>

          {hasActive
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
                onClick={() => setSaveModalOpen(true)}
              >
                <Bookmark className="size-3" />
                Save
              </Button>
            )
            : null}
        </div>

        <CollapsibleContent className="space-y-1">
          {isLoading
            ? <p className="text-xs text-muted-foreground">Loading…</p>
            : null}

          {!isLoading && savedFilters.length === 0
            ? <p className="text-xs text-muted-foreground">No saved filters yet.</p>
            : null}

          {savedFilters.map(filter => (
            <button
              key={filter.id}
              type="button"
              className="
                w-full rounded-sm px-2 py-1 text-left text-sm
                hover:bg-accent hover:text-accent-foreground
              "
              onClick={() => onSearchChange(validateBookmarkSearch(filter.filters))}
            >
              {filter.name}
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <InlineCreateModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        title="Save current filters"
        description="Give this set of filters a name so you can apply it again later."
        placeholder="e.g. Tech Videos"
        submitLabel="Save filter"
        pendingLabel="Saving…"
        isError={createMutation.isError}
        errorMessage={createMutation.error?.message}
        onSubmit={(name, done) => {
          createMutation.mutate(
            {
              name,
              filters: search as Record<string, unknown>,
            },
            {
              onSuccess: done,
            },
          );
        }}
      />
    </>
  );
}
