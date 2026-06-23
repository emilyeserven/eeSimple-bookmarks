import { FilterSections } from "../FilterSidebarSections";
import { SavedFiltersSection } from "../SavedFiltersSection";

import { Separator } from "@/components/ui/separator";
import { useUiStore } from "@/stores/uiStore";

/**
 * Panel body for `dCT === "filters"`. Reads the transient filter context set by the active listing
 * page and renders the filter sections live. Shows a disabled message when not on a listing page.
 */
export function FiltersPanel() {
  const filterContext = useUiStore(state => state.filterContext);

  if (!filterContext) {
    return (
      <div className="space-y-2 py-4 text-center text-sm text-muted-foreground">
        <p className="font-medium">No listing page active</p>
        <p>Navigate to Bookmarks or a Category page to use filters here.</p>
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
    authors,
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
  const hasAuthorFilter = (authors?.length ?? 0) > 0;
  const hasTags = tree.length > 0;
  const hasProperties = enabledProperties.length > 0;

  return (
    <div className="space-y-8">
      <SavedFiltersSection
        search={search}
        onSearchChange={onSearchChange}
      />

      {(hasTags || hasProperties || hasCategoryFilter || hasMediaTypeFilter || hasChannelFilter || hasWebsiteFilter || hasRelationshipTypeFilter || hasAuthorFilter)
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
        authors={authors}
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
        hasAuthorFilter={hasAuthorFilter}
      />
    </div>
  );
}
