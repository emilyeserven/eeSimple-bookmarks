import { MediaTypeListItem } from "./MediaTypeListItem";
import { useSetListingPage } from "../hooks/useListingPage";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

import { useUiStore } from "@/stores/uiStore";

/** Browsable, searchable media-type listing. Shared by the Media Types taxonomy page and the Settings page. */
export function MediaTypesListing() {
  const {
    data: allMediaTypes, isLoading, error,
  } = useMediaTypes();
  useSetListingPage("media-types-listing");
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("media-types-listing");

  const rawQuery = useUiStore(state => state.headerSearchQuery);
  const q = rawQuery.trim().toLowerCase();
  const filtered = (allMediaTypes ?? []).filter((m) => {
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
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
            No media types match &ldquo;{rawQuery}&rdquo;.
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
