import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddWebsiteModal } from "./AddWebsiteModal";
import { ColumnsSwitcher } from "./ColumnsSwitcher";
import { WebsiteListItem } from "./WebsiteListItem";
import { useWebsites } from "../hooks/useWebsites";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Browsable, searchable website listing with add modal. Shared by the Websites taxonomy page and the Settings Websites page. */
export function WebsitesListing() {
  const {
    data: allWebsites, isLoading, error,
  } = useWebsites();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const columns = useBookmarkColumns("websites-listing");
  const navigate = useNavigate();

  const q = search.trim().toLowerCase();
  const filtered = (allWebsites ?? []).filter((w) => {
    if (!q) return true;
    return w.siteName.toLowerCase().includes(q) || w.domain.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by name or domain…"
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="max-w-sm"
          />
          <ColumnsSwitcher pageKey="websites-listing" />
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
              No websites match &ldquo;{search}&rdquo;.
            </p>
          )
          : null}

        {filtered.length > 0
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
