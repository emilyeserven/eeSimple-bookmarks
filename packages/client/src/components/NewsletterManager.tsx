import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddNewsletterModal } from "./AddNewsletterModal";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { NewsletterListItem } from "./NewsletterListItem";
import { NewsletterTable } from "./NewsletterTable";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useBulkDeleteNewsletters, useNewsletters } from "../hooks/useNewsletters";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/** Browsable, searchable newsletter listing with an inline add modal. */
export function NewslettersListing() {
  const {
    data: allNewsletters, isLoading, error,
  } = useNewsletters();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("newsletters-listing", false, false, false, () => setModalOpen(true), false, {
    addBookmark: {},
    createLabel: "New newsletter",
  });
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("newsletters-listing");
  const viewMode = useViewMode("newsletters-listing");
  const navigate = useNavigate();

  const newsletters = allNewsletters ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    newsletters,
    (n, query) => n.name.toLowerCase().includes(query),
  );

  const deletableIds = filtered.map(n => n.id);
  const selection = useListSelection("newsletters-listing", deletableIds);
  useRegisterBulkSelect("newsletters-listing");
  const bulkDelete = useBulkDeleteNewsletters();

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={newsletters.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading imports…"
        entityPlural="imports"
        emptyMessage={(
          <p className="text-muted-foreground">
            No imports yet. Add one above, then select it when adding an import.
          </p>
        )}
      />

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["newsletter", "newsletters"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <NewsletterTable
            newsletters={filtered}
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
            {filtered.map(newsletter => (
              <NewsletterListItem
                key={newsletter.id}
                newsletter={newsletter}
                selectable
                selected={selection.isSelected(newsletter.id)}
                onSelectToggle={() => selection.toggle(newsletter.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}

      <AddNewsletterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(newsletter) => {
          void navigate({
            to: "/taxonomies/newsletters/$newsletterSlug/edit/general",
            params: {
              newsletterSlug: newsletter.slug,
            },
          });
        }}
      />
    </div>
  );
}
