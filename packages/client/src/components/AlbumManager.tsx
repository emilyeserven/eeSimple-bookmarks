import { ListingScaffold } from "./ListingScaffold";

import { albumListingConfig } from "@/entities/album";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable album listing. */
export function AlbumsListing() {
  // The route (taxonomies.albums.index) owns the useSetListingPage registration — a second bare call
  // here would clobber its create-button affordances.
  const state = useListingScaffold(albumListingConfig);
  return (
    <ListingScaffold
      config={albumListingConfig}
      state={state}
    />
  );
}
