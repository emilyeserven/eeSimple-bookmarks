import { ListingScaffold } from "./ListingScaffold";

import { episodeListingConfig } from "@/entities/episode";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable episode listing. */
export function EpisodesListing() {
  // The route (taxonomies.episodes.index) owns the useSetListingPage registration — a second bare call
  // here would clobber its create-button affordances.
  const state = useListingScaffold(episodeListingConfig);
  return (
    <ListingScaffold
      config={episodeListingConfig}
      state={state}
    />
  );
}
