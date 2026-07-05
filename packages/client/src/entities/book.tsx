import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Book, UpdateBookInput } from "@eesimple/types";

import { BookListItem } from "../components/BookListItem";
import { BookTable } from "../components/BookTable";
import { bookWorkbench } from "../components/workbench/book";
import { useBooks, useBulkDeleteBooks } from "../hooks/useBooks";
import i18n from "../i18n";
import { booksApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const BOOK_ROUTE: EntityRoute = {
  kind: "book",
  prefix: "/taxonomies/books",
  slugIndex: 2,
  listLabel: i18n.t("Books"),
  singular: i18n.t("Book"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const BOOK_PALETTE: EntityPaletteConfig = {
  queryKey: ["books"],
  listFn: () => booksApi.list(),
  updateFn: (id, patch) => booksApi.update(id, patch as UpdateBookInput),
  extraInvalidateKeys: [["media-properties"], ["bookmarks"]],
};

export const bookListingConfig: EntityListingConfig<Book> = {
  pageKey: "books-listing",
  useItems: useBooks,
  matches: (book, query) =>
    book.name.toLowerCase().includes(query) || book.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteBooks,
  noun: [i18n.t("book"), i18n.t("books")],
  loadingLabel: i18n.t("Loading books…"),
  entityPlural: i18n.t("books"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No books yet.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <BookListItem
      book={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <BookTable
      data={entities}
      selection={selection}
    />
  ),
};

export const bookDescriptor: EntityDescriptor<Book> = {
  kind: "book",
  route: BOOK_ROUTE,
  palette: BOOK_PALETTE,
  workbench: bookWorkbench,
  listing: bookListingConfig,
};
