import { ListingScaffold } from "./ListingScaffold";

import { bookListingConfig } from "@/entities/book";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable book listing. */
export function BooksListing() {
  // The route (taxonomies.books.index) owns the useSetListingPage registration — a second bare call
  // here would clobber its create-button affordances.
  const state = useListingScaffold(bookListingConfig);
  return (
    <ListingScaffold
      config={bookListingConfig}
      state={state}
    />
  );
}
