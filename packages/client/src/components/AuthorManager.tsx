import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddAuthorModal } from "./AddAuthorModal";
import { AuthorListItem } from "./AuthorListItem";
import { AuthorTable } from "./AuthorTable";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { useAuthors, useBulkDeleteAuthors } from "../hooks/useAuthors";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/** Browsable, searchable author listing with an inline add modal. */
export function AuthorsListing() {
  const {
    data: allAuthors, isLoading, error,
  } = useAuthors();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("authors-listing", false, false, false, () => setModalOpen(true), false, {
    addBookmark: {},
    createLabel: "New author",
  });
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("authors-listing");
  const viewMode = useViewMode("authors-listing");
  const navigate = useNavigate();

  const authors = allAuthors ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    authors,
    (a, query) => a.name.toLowerCase().includes(query),
  );

  const deletableIds = filtered.map(a => a.id);
  const selection = useListSelection("authors-listing", deletableIds);
  useRegisterBulkSelect("authors-listing");
  const bulkDelete = useBulkDeleteAuthors();

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={authors.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading authors…"
        entityPlural="authors"
        emptyMessage={(
          <p className="text-muted-foreground">
            No authors yet. Add one above, then assign them to bookmarks.
          </p>
        )}
      />

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["author", "authors"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <AuthorTable
            authors={filtered}
            selection={selection}
          />
        )
        : null}

      {filtered.length > 0 && viewMode !== "table"
        ? (
          <div
            className={`
              grid gap-2
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(author => (
              <AuthorListItem
                key={author.id}
                author={author}
                selectable
                selected={selection.isSelected(author.id)}
                onSelectToggle={() => selection.toggle(author.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}

      <AddAuthorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(author) => {
          void navigate({
            to: "/taxonomies/authors/$authorSlug/edit/general",
            params: {
              authorSlug: author.slug,
            },
          });
        }}
      />
    </div>
  );
}
