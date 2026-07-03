import { ListingScaffold } from "./ListingScaffold";

import { artistListingConfig } from "@/entities/artist";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable artist listing. */
export function ArtistsListing() {
  // The route (taxonomies.artists.index) owns the useSetListingPage registration — a second bare call
  // here would clobber its create-button affordances.
  const state = useListingScaffold(artistListingConfig);
  return (
    <ListingScaffold
      config={artistListingConfig}
      state={state}
    />
  );
}
