import type { Author } from "@eesimple/types";

import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";
import { Info, Pencil, UserRound } from "lucide-react";

import { AddAuthorModal } from "./AddAuthorModal";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useAuthors } from "../hooks/useAuthors";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";
import { SIDEBAR_MODIFIER_LABELS } from "../lib/sidebarModifier";

/** A single row in the author listing: name, bookmark count, and hover Edit / Info. */
function AuthorListItem({
  author,
}: { author: Author }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <StandardListingCard
      icon={(
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-full bg-muted text-muted-foreground
          "
        >
          <UserRound className="size-4" />
        </span>
      )}
      title={author.name}
      count={author.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/authors/$authorSlug/general"
          params={{
            authorSlug: author.slug,
          }}
          title={`View ${author.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/authors/$authorSlug/edit/general"
            params={{
              authorSlug: author.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "author", author.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {author.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/authors/$authorSlug/general"
            params={{
              authorSlug: author.slug,
            }}
            title={`Info (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => viewClick(event, "author", author.id)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {author.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}

/** Browsable, searchable author listing with an inline add modal. */
export function AuthorsListing() {
  const {
    data: allAuthors, isLoading, error,
  } = useAuthors();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("authors-listing", false, false, false, () => setModalOpen(true));
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
