import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddWebsiteModal } from "./AddWebsiteModal";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useWebsiteColumns } from "./tables/websiteColumns";
import { WebsiteListItem } from "./WebsiteListItem";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useWebsites } from "../hooks/useWebsites";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useUiStore } from "@/stores/uiStore";

/** Browsable, searchable website listing with add modal. Shared by the Websites taxonomy page and the Settings Websites page. */
export function WebsitesListing() {
  const {
    data: allWebsites, isLoading, error,
  } = useWebsites();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("websites-listing");
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("websites-listing");
  const viewMode = useViewMode("websites-listing");
  const websiteColumns = useWebsiteColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  const rawQuery = useUiStore(state => state.headerSearchQuery);
  const q = rawQuery.trim().toLowerCase();
  const filtered = (allWebsites ?? []).filter((w) => {
    if (!q) return true;
    return w.siteName.toLowerCase().includes(q) || w.domain.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="ml-auto">
            <Button
              type="button"
              size="sm"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="size-4" />
              New website
            </Button>
          </div>
        </div>

        {q && filtered.length < (allWebsites?.length ?? 0)
          ? (
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {allWebsites?.length ?? 0}
            </p>
          )
          : null}

        {isLoading ? <p className="text-muted-foreground">Loading websites…</p> : null}
        {error ? <p className="text-destructive">{error.message}</p> : null}
        {!isLoading && (allWebsites?.length ?? 0) === 0
          ? (
            <p className="text-muted-foreground">
              No websites yet. They&apos;re created automatically when you add bookmarks.
            </p>
          )
          : null}
        {!isLoading && (allWebsites?.length ?? 0) > 0 && filtered.length === 0
          ? (
            <p className="text-muted-foreground">
              No websites match &ldquo;{rawQuery}&rdquo;.
            </p>
          )
          : null}

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
