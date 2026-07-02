import { ListingScaffold } from "./ListingScaffold";

import { propertyGroupListingConfig } from "@/entities/propertyGroup";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable property-group listing. */
export function PropertyGroupsListing() {
  // The route (taxonomies.property-groups.index) owns the useSetListingPage registration — a second
  // bare call here would clobber its create-button affordances.
  const state = useListingScaffold(propertyGroupListingConfig);
  return (
    <ListingScaffold
      config={propertyGroupListingConfig}
      state={state}
    />
  );
}
