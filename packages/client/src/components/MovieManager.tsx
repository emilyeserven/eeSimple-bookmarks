import { ListingScaffold } from "./ListingScaffold";

import { movieListingConfig } from "@/entities/movie";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable movie listing. */
export function MoviesListing() {
  // The route (taxonomies.movies.index) owns the useSetListingPage registration — a second bare call
  // here would clobber its create-button affordances.
  const state = useListingScaffold(movieListingConfig);
  return (
    <ListingScaffold
      config={movieListingConfig}
      state={state}
    />
  );
}
