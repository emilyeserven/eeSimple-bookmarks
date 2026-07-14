import type { FilterPillsRowProps } from "./FilterPillsRow";

import { useState } from "react";

import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FilterSections } from "./FilterSidebarSections";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  FILTER_FACETS,
  facetHasActiveSelection,
  languageUsageHasActiveSelection,
  propertyHasActiveSelection,
} from "../lib/filterFacets";
import { computeFacetData } from "../lib/filterVisibility";

import { cn } from "@/lib/utils";

/**
 * The mobile "Filter" button + modal (a sibling of {@link BookmarkSortPopover} in the phone controls
 * row). Its parent gates it to `md:hidden`, so it uses a plain `Dialog` rather than
 * {@link ResponsivePopover}. The modal body is the full stacked {@link FilterSections} — every facet
 * section that has data, driven straight off the same search + facet inputs the pill row uses. The
 * trigger shows the active-filter count so the collapsed state still signals that filters apply.
 */
export function BookmarkFilterModalButton(props: FilterPillsRowProps) {
  const {
    tree, properties, categories, mediaTypes, youtubeChannels, websites, relationshipTypes,
    people, placeTypes, genreMoods, bookmarks, search, onSearchChange,
  } = props;
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);

  const enabledProperties = properties.filter(property => property.enabled);
  const facetData = computeFacetData(props);
  const activeCount
    = FILTER_FACETS.filter(facet => facetHasActiveSelection(facet.key, search)).length
      + enabledProperties.filter(property => propertyHasActiveSelection(property.id, search)).length
      + (languageUsageHasActiveSelection(search) ? 1 : 0);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={t("Filter bookmarks")}
        >
          <Filter className={cn("size-4", activeCount > 0 && "text-primary")} />
          {t("Filter")}
          {activeCount > 0
            ? (
              <span
                className="
                  ml-0.5 inline-flex min-w-4 items-center justify-center
                  rounded-full bg-primary px-1 text-xs font-semibold
                  text-primary-foreground
                "
              >
                {activeCount}
              </span>
            )
            : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md gap-0 overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle>{t("Filters")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <FilterSections
            tree={tree}
            enabledProperties={enabledProperties}
            categories={categories}
            mediaTypes={mediaTypes}
            youtubeChannels={youtubeChannels}
            websites={websites}
            relationshipTypes={relationshipTypes}
            people={people}
            placeTypes={placeTypes}
            genreMoods={genreMoods}
            bookmarks={bookmarks}
            search={search}
            onSearchChange={onSearchChange}
            hasTags={facetData.tags}
            hasProperties={enabledProperties.length > 0}
            hasSectionsFilter={facetData.sections}
            hasCategoryFilter={facetData.categories}
            hasMediaTypeFilter={facetData["media-types"]}
            hasChannelFilter={facetData.channels}
            hasWebsiteFilter={facetData.websites}
            hasRelationshipTypeFilter={facetData["relationship-types"]}
            hasPersonFilter={facetData.people}
            hasPlaceTypeFilter={facetData["place-types"]}
            hasGenreMoodFilter={facetData["genre-moods"]}
            hasMediaSourceFilter={facetData["media-source"]}
            hasFillableFieldsFilter={facetData["fillable-fields"]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
