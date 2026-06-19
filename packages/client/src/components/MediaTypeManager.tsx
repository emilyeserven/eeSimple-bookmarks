import { useState } from "react";

import { MediaTypeListItem } from "./MediaTypeListItem";
import { useSetListingPage } from "../hooks/useListingPage";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

import { Input } from "@/components/ui/input";

/** Browsable, searchable media-type listing. Shared by the Media Types taxonomy page and the Settings page. */
export function MediaTypesListing() {
  const {
    data: allMediaTypes, isLoading, error,
  } = useMediaTypes();
  const [search, setSearch] = useState("");
  useSetListingPage("media-types-listing");
  const columns = useBookmarkColumns("media-types-listing");

  const q = search.trim().toLowerCase();
  const filtered = (allMediaTypes ?? []).filter((m) => {
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="max-w-sm"
        />
      </div>

      {q && filtered.length < (allMediaTypes?.length ?? 0)
        ? (
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {allMediaTypes?.length ?? 0}
          </p>
        )
        : null}

      {isLoading ? <p className="text-muted-foreground">Loading media types…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (allMediaTypes?.length ?? 0) === 0
        ? (
          <p className="text-muted-foreground">
            No media types yet.
          </p>
        )
        : null}
      {!isLoading && (allMediaTypes?.length ?? 0) > 0 && filtered.length === 0
        ? (
          <p className="text-muted-foreground">
            No media types match &ldquo;{search}&rdquo;.
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
            {filtered.map(mediaType => (
              <MediaTypeListItem
                key={mediaType.id}
                mediaType={mediaType}
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
