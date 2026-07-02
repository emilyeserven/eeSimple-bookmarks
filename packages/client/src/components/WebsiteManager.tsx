import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddWebsiteModal } from "./AddWebsiteModal";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { WebsiteListBody } from "./WebsiteListBody";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useWebsites } from "../hooks/useWebsites";

/** Browsable, searchable website listing with add modal. Shared by the Websites taxonomy page and the Settings Websites page. */
export function WebsitesListing() {
  const {
    data: allWebsites, isLoading, error,
  } = useWebsites();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("websites-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New website",
  });
  useRegisterHeaderSearch();
  const navigate = useNavigate();

  const websites = allWebsites ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    websites,
    (w, query) => w.siteName.toLowerCase().includes(query) || w.domain.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <ListingStatusMessages
          isLoading={isLoading}
          error={error}
          totalCount={websites.length}
          filteredCount={filtered.length}
          rawQuery={rawQuery}
          hasQuery={hasQuery}
          loadingLabel="Loading websites…"
          entityPlural="websites"
          emptyMessage={(
            <p className="text-muted-foreground">
              No websites yet. They&apos;re created automatically when you add bookmarks.
            </p>
          )}
        />

        <WebsiteListBody filtered={filtered} />
      </div>

      <AddWebsiteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(website) => {
          void navigate({
            to: "/taxonomies/websites/$websiteSlug/edit/general",
            params: {
              websiteSlug: website.slug,
            },
          });
        }}
      />
    </div>
  );
}
