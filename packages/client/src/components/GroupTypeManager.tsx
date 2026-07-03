import { ListingScaffold } from "./ListingScaffold";

import { groupTypeListingConfig } from "@/entities/groupType";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable group-type listing. */
export function GroupTypesListing() {
  // The route (taxonomies.group-types.index) owns the useSetListingPage registration — a second
  // bare call here would clobber its create-button affordances.
  const state = useListingScaffold(groupTypeListingConfig);
  return (
    <ListingScaffold
      config={groupTypeListingConfig}
      state={state}
    />
  );
}
