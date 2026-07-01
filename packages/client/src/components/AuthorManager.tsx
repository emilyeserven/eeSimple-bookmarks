import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddAuthorModal } from "./AddAuthorModal";
import { AuthorListItem } from "./AuthorListItem";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { useAuthors } from "../hooks/useAuthors";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

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
  const navigate = useNavigate();

  const authors = allAuthors ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    authors,
    (a, query) => a.name.toLowerCase().includes(query),
  );

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

      {filtered.length > 0
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
