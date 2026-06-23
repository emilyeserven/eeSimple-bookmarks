import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddNewsletterModal } from "./AddNewsletterModal";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { NewsletterListItem } from "./NewsletterListItem";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useNewsletters } from "../hooks/useNewsletters";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

/** Browsable, searchable newsletter listing with an inline add modal. */
export function NewslettersListing() {
  const {
    data: allNewsletters, isLoading, error,
  } = useNewsletters();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("newsletters-listing", false, false, false, () => setModalOpen(true));
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("newsletters-listing");
  const navigate = useNavigate();

  const newsletters = allNewsletters ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    newsletters,
    (n, query) => n.name.toLowerCase().includes(query),
  );

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

      {filtered.length > 0
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
