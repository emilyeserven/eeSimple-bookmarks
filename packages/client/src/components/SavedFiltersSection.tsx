import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useState } from "react";

import { Bookmark, ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useCreateSavedFilter, useSavedFilters } from "../hooks/useSavedFilters";
import { bookmarkSearchEquals, hasAnyActiveFilter, validateBookmarkSearch } from "../lib/bookmarkSearch";

import { Button } from "@/components/ui/button";

interface SavedFiltersSectionProps {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * "Saved Filters" controls for the filter sidebar and panel. A "Clear Filters" button (disabled
 * when nothing is applied) sits above a dropdown of saved filters; selecting one applies it. The
 * dropdown trigger reflects the currently-selected saved filter when the applied filters match it.
 * Saving the current filter state lives in the dropdown's "Save current filters…" item.
 */
export function SavedFiltersSection({
  search, onSearchChange,
}: SavedFiltersSectionProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: savedFilters = [], isLoading,
  } = useSavedFilters();
  const createMutation = useCreateSavedFilter();
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // A sort with no other filters is still worth naming/saving, even though it doesn't
  // narrow which bookmarks match (hasAnyActiveFilter is deliberately blind to it).
  const hasActive = hasAnyActiveFilter(search) || search.sort != null;

  if (!hasActive && savedFilters.length === 0 && !isLoading) return null;

  const activeFilter = hasActive
    ? savedFilters.find(filter =>
      bookmarkSearchEquals(search as Record<string, unknown>, filter.filters))
    : undefined;

  return (
    <>
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          disabled={!hasActive}
          onClick={() => onSearchChange({})}
        >
          <X className="size-3.5" />
          {t("Clear Filters")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-between font-normal"
            >
              <span className="truncate">{activeFilter?.name ?? t("Saved Filters")}</span>
              <ChevronDown className="size-3.5 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-48"
          >
            {isLoading
              ? <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("Loading…")}</p>
              : null}

            {!isLoading && savedFilters.length === 0
              ? <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("No saved filters yet.")}</p>
              : null}

            {savedFilters.map(filter => (
              <DropdownMenuItem
                key={filter.id}
                onSelect={() => onSearchChange(validateBookmarkSearch(filter.filters))}
              >
                {filter.name}
              </DropdownMenuItem>
            ))}

            {savedFilters.length > 0 ? <DropdownMenuSeparator /> : null}

            <DropdownMenuItem
              disabled={!hasActive}
              onSelect={() => setSaveModalOpen(true)}
            >
              <Bookmark className="size-3.5" />
              {t("Save current filters…")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <InlineCreateModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        title={t("Save current filters")}
        description={t("Give this set of filters a name so you can apply it again later.")}
        placeholder={t("e.g. Tech Videos")}
        submitLabel={t("Save filter")}
        pendingLabel={t("Saving…")}
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
