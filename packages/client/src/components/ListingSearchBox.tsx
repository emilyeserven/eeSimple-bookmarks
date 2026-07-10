import type { ReactNode } from "react";

import { Pin, PinOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListingDisplayControls } from "./ListingDisplayControls";
import { ListingSearchBar } from "./ListingSearchBar";
import { Button } from "./ui/button";
import { RowCard } from "./ui/card";

import {
  useDisplayPreferenceSettings,
  useSearchBoxPinned,
  useUpdateDisplayPreferenceSettings,
} from "@/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

interface ListingSearchBoxProps {
  /** Sort control rendered to the right of the search input (bookmark listings only). */
  sort?: ReactNode;
  /** Filter pills rendered below the search row (bookmark listings only). */
  filters?: ReactNode;
}

/**
 * The on-page control box every listing renders above its results: the quick-search input (left) with
 * an optional Sort control (right, `≥md` only — on phones it drops into the filter slot's controls row)
 * on the top row and the filter pills wrapping below. The pin button
 * floats the whole box — sticking it to the top of the viewport while the list scrolls — via the
 * server-persisted {@link useSearchBoxPinned} preference (mirrors the right-panel pin, so the choice
 * follows the user across devices and fires a save toast). Taxonomy listings render it with just the
 * search input; bookmark listings pass the `sort` and `filters` slots.
 *
 * The per-listing Display controls (view mode, column count, and — on image-bearing listings — the
 * image Aspect override) render as a block **directly beneath** the box (not inside it), keyed to the
 * registered listing page; this replaces the former header Display popover.
 */
export function ListingSearchBox({
  sort,
  filters,
}: ListingSearchBoxProps) {
  const pinned = useSearchBoxPinned();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();
  const listingPage = useUiStore(state => state.listingPage);
  const {
    t,
  } = useTranslation();

  function togglePinned() {
    if (!displayData) return;
    const next = !pinned;
    update.mutate({
      input: {
        ...displayData,
        searchBoxPinned: next,
      },
      successMessage: next ? t("Search box pinned") : t("Search box unpinned"),
    });
  }

  return (
    <div className="space-y-2">
      <RowCard
        className={cn("space-y-3 p-3", pinned && "sticky top-0 z-30 shadow-md")}
      >
        <div className="flex items-center gap-2">
          <ListingSearchBar />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {sort
              ? (
                <div
                  className="
                    hidden
                    md:flex
                  "
                >{sort}
                </div>
              )
              : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={pinned ? t("Unpin search box") : t("Pin search box")}
              aria-pressed={pinned}
              onClick={togglePinned}
            >
              {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
            </Button>
          </div>
        </div>
        {filters}
      </RowCard>
      {listingPage
        ? (
          <ListingDisplayControls
            pageKey={listingPage.key}
            showImageControls={listingPage.showsImages}
          />
        )
        : null}
    </div>
  );
}
