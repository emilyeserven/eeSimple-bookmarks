import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Author, UpdateAuthorInput } from "@eesimple/types";

import { AuthorListItem } from "../components/AuthorListItem";
import { AuthorTable } from "../components/AuthorTable";
import { authorWorkbench } from "../components/workbench/author";
import { useAuthors, useBulkDeleteAuthors } from "../hooks/useAuthors";
import { authorsApi } from "../lib/api/taxonomies";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const AUTHOR_ROUTE: EntityRoute = {
  kind: "author",
  prefix: "/taxonomies/authors",
  slugIndex: 2,
  listLabel: "Authors",
  singular: "Author",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const AUTHOR_PALETTE: EntityPaletteConfig = {
  queryKey: ["authors"],
  listFn: () => authorsApi.list(),
  updateFn: (id, patch) => authorsApi.update(id, patch as UpdateAuthorInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

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
    entity, allItems, ...rest
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
