import type { Publisher } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { BookOpen, Info, Pencil } from "lucide-react";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useBulkDeletePublishers, usePublishers } from "../hooks/usePublishers";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "../lib/sidebarModifier";
import { useListSelection } from "../lib/useListSelection";

interface PublisherListItemProps {
  publisher: Publisher;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the publisher listing: name, website info, bookmark count, and hover Edit / Info. */
function PublisherListItem({
  publisher,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: PublisherListItemProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  const websiteLabel = publisher.website
    ? (publisher.website.siteName
      ? `${publisher.website.siteName} (${publisher.website.domain})`
      : publisher.website.domain)
    : undefined;

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={(
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-full bg-muted text-muted-foreground
          "
        >
          <BookOpen className="size-4" />
        </span>
      )}
      title={publisher.name}
      subtitle={websiteLabel}
      count={publisher.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/publishers/$publisherSlug/general"
          params={{
            publisherSlug: publisher.slug,
          }}
          title={`View ${publisher.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/publishers/$publisherSlug/edit/general"
            params={{
              publisherSlug: publisher.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "publisher", publisher.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {publisher.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/publishers/$publisherSlug/general"
            params={{
              publisherSlug: publisher.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "publisher", publisher.id, publisher.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {publisher.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}

/** Browsable, searchable publisher listing. Shared by the Publishers taxonomy page. */
export function PublishersListing() {
  const {
    data: allPublishers, isLoading, error,
  } = usePublishers();
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("publishers-listing");

  const publishers = allPublishers ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    publishers,
    (p, query) => p.name.toLowerCase().includes(query),
  );

  const deletableIds = filtered.map(p => p.id);
  const selection = useListSelection("publishers-listing", deletableIds);
  useRegisterBulkSelect("publishers-listing");
  const bulkDelete = useBulkDeletePublishers();

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={publishers.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading publishers…"
        entityPlural="publishers"
        emptyMessage={(
          <p className="text-muted-foreground">
            No publishers yet. Add one above, then assign them to bookmarks.
          </p>
        )}
      />

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["publisher", "publishers"]}
      />

      {filtered.length > 0
        ? (
          <div
            className={`
              grid gap-2
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(publisher => (
              <PublisherListItem
                key={publisher.id}
                publisher={publisher}
                selectable
                selected={selection.isSelected(publisher.id)}
                onSelectToggle={() => selection.toggle(publisher.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
