import { useTranslation } from "react-i18next";

import { FilterSections } from "../FilterSidebarSections";
import { SavedFiltersSection } from "../SavedFiltersSection";

import { Separator } from "@/components/ui/separator";
import { useUiStore } from "@/stores/uiStore";

/**
 * Panel body for `dCT === "filters"`. Reads the transient filter context set by the active listing
 * page and renders the filter sections live. Shows a disabled message when not on a listing page.
 */
export function FiltersPanel() {
  const {
    t,
  } = useTranslation();
  const filterContext = useUiStore(state => state.filterContext);

  if (!filterContext) {
    return (
      <div className="space-y-2 py-4 text-center text-sm text-muted-foreground">
        <p className="font-medium">{t("No listing page active")}</p>
        <p>{t("Navigate to Bookmarks or a Category page to use filters here.")}</p>
      </div>
    );
  }

  const {
    tree,
    properties,
    propertyGroups,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
    bookmarks,
    search,
    onSearchChange,
  } = filterContext;

  const enabledProperties = properties.filter(p => p.enabled);
  const hasCategoryFilter = (categories?.length ?? 0) > 0;
  const hasMediaTypeFilter = (mediaTypes?.length ?? 0) > 0;
  const hasChannelFilter = (youtubeChannels?.length ?? 0) > 0;
  const hasWebsiteFilter = (websites?.length ?? 0) > 0;
  const hasRelationshipTypeFilter = (relationshipTypes?.length ?? 0) > 0;
  const hasPersonFilter = (people?.length ?? 0) > 0;
  const hasPlaceTypeFilter = (placeTypes?.length ?? 0) > 0;
  const hasGenreMoodFilter = (genreMoods?.length ?? 0) > 0;
  const hasTags = tree.length > 0;
  const hasProperties = enabledProperties.length > 0;
  const hasSectionsFilter = enabledProperties.some(p => p.type === "sections");
  const hasMediaSourceFilter = bookmarks.some(b =>
    b.plexRatingKey != null || b.kavitaSeriesId != null || b.isbn != null || b.feedUrl != null);

  return (
    <div className="space-y-8">
      <SavedFiltersSection
        search={search}
        onSearchChange={onSearchChange}
      />

      {(hasTags || hasProperties || hasSectionsFilter || hasCategoryFilter || hasMediaTypeFilter || hasChannelFilter || hasWebsiteFilter || hasRelationshipTypeFilter || hasPersonFilter || hasPlaceTypeFilter)
        ? <Separator />
        : null}

      <FilterSections
        tree={tree}
        enabledProperties={enabledProperties}
        propertyGroups={propertyGroups}
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
        hasTags={hasTags}
        hasProperties={hasProperties}
        hasCategoryFilter={hasCategoryFilter}
        hasMediaTypeFilter={hasMediaTypeFilter}
        hasChannelFilter={hasChannelFilter}
        hasWebsiteFilter={hasWebsiteFilter}
        hasRelationshipTypeFilter={hasRelationshipTypeFilter}
        hasPersonFilter={hasPersonFilter}
        hasPlaceTypeFilter={hasPlaceTypeFilter}
        hasGenreMoodFilter={hasGenreMoodFilter}
        hasSectionsFilter={hasSectionsFilter}
        hasMediaSourceFilter={hasMediaSourceFilter}
      />
    </div>
  );
}
