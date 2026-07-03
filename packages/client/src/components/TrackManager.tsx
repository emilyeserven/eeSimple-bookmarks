import { ListingScaffold } from "./ListingScaffold";

import { trackListingConfig } from "@/entities/track";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable track listing. */
export function TracksListing() {
  // The route (taxonomies.tracks.index) owns the useSetListingPage registration — a second bare call
  // here would clobber its create-button affordances.
  const state = useListingScaffold(trackListingConfig);
  return (
    <ListingScaffold
      config={trackListingConfig}
      state={state}
    />
  );
}
