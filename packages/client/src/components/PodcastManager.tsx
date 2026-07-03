import { ListingScaffold } from "./ListingScaffold";

import { podcastListingConfig } from "@/entities/podcast";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable podcast listing. */
export function PodcastsListing() {
  // The route (taxonomies.podcasts.index) owns the useSetListingPage registration — a second bare
  // call here would clobber its create-button affordances.
  const state = useListingScaffold(podcastListingConfig);
  return (
    <ListingScaffold
      config={podcastListingConfig}
      state={state}
    />
  );
}
