import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddWebsiteModal } from "./AddWebsiteModal";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useWebsiteColumns } from "./tables/websiteColumns";
import { WebsiteListItem } from "./WebsiteListItem";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useWebsites } from "../hooks/useWebsites";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";

import { DataTable } from "@/components/ui/data-table";

/** Browsable, searchable website listing with add modal. Shared by the Websites taxonomy page and the Settings Websites page. */
export function WebsitesListing() {
  const {
    data: allWebsites, isLoading, error,
  } = useWebsites();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("websites-listing", false, false, false, () => setModalOpen(true));
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("websites-listing");
  const viewMode = useViewMode("websites-listing");
  const websiteColumns = useWebsiteColumns();
  const rowNav = useTableRowNav();
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

        {filtered.length > 0 && viewMode === "table"
          ? (
            <DataTable
              columns={websiteColumns}
              data={filtered}
              sortable
              onRowClick={(website, event) =>
                rowNav(event, "website", website.id, () => {
                  void navigate({
                    to: "/taxonomies/websites/$websiteSlug",
                    params: {
                      websiteSlug: website.slug,
                    },
                  });
                }, () => {
                  void navigate({
                    to: "/taxonomies/websites/$websiteSlug/edit/general",
                    params: {
                      websiteSlug: website.slug,
                    },
                  });
                })}
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
              {filtered.map(website => (
                <WebsiteListItem
                  key={website.id}
                  website={website}
                />
              ))}
            </div>
          )
          : null}
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
