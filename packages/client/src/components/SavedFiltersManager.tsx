import { ListingScaffold } from "./ListingScaffold";

import { savedFilterListingConfig } from "@/entities/savedFilter";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable saved-filter listing with bulk delete + "viewable online" controls; used on /saved-filters. */
export function SavedFiltersManager() {
  useSetListingPage("saved-filters-listing");
  const state = useListingScaffold(savedFilterListingConfig);
  return (
    <ListingScaffold
      config={savedFilterListingConfig}
      state={state}
    />
  );
}
