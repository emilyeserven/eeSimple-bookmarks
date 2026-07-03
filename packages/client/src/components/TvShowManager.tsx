import { ListingScaffold } from "./ListingScaffold";

import { tvShowListingConfig } from "@/entities/tvShow";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable TV-show listing. */
export function TvShowsListing() {
  // The route (taxonomies.tv-shows.index) owns the useSetListingPage registration — a second bare
  // call here would clobber its create-button affordances.
  const state = useListingScaffold(tvShowListingConfig);
  return (
    <ListingScaffold
      config={tvShowListingConfig}
      state={state}
    />
  );
}
