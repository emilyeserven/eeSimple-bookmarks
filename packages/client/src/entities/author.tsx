import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { Author } from "@eesimple/types";

import { AuthorListItem } from "../components/AuthorListItem";
import { AuthorTable } from "../components/AuthorTable";
import { authorWorkbench } from "../components/workbench/author";
import { useAuthors, useBulkDeleteAuthors } from "../hooks/useAuthors";
import { AUTHOR_PALETTE } from "../lib/entityPaletteRegistry";
import { AUTHOR_ROUTE } from "../lib/entityRoutes";

export const authorListingConfig: EntityListingConfig<Author> = {
  pageKey: "authors-listing",
  useItems: useAuthors,
  matches: (author, query) => author.name.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteAuthors,
  noun: ["author", "authors"],
  loadingLabel: "Loading authors…",
  entityPlural: "authors",
  emptyMessage: (
    <p className="text-muted-foreground">
      No authors yet. Add one above, then assign them to bookmarks.
    </p>
  ),
  renderListItem: ({
    entity, ...rest
  }) => (
    <AuthorListItem
      author={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <AuthorTable
      authors={entities}
      selection={selection}
    />
  ),
};

/** Second `EntityDescriptor` migration (after Publisher, PR #868) — issue #860. */
export const authorDescriptor: EntityDescriptor<Author> = {
  kind: "author",
  route: AUTHOR_ROUTE,
  palette: AUTHOR_PALETTE,
  workbench: authorWorkbench,
  listing: authorListingConfig,
};
