import type { ReactNode } from "react";

export interface ListingStatusMessagesProps {
  isLoading: boolean;
  error: Error | null;
  /** Total (unfiltered) item count. */
  totalCount: number;
  /** Item count after the header-search filter. */
  filteredCount: number;
  /** The raw (untrimmed) header search query, shown in the "no match" message. */
  rawQuery: string;
  /** Whether a non-empty search query is active. */
  hasQuery: boolean;
  /** Text shown while loading, e.g. "Loading websites…". */
  loadingLabel: string;
  /** Lowercase plural entity name for the "No {plural} match …" line, e.g. "websites". */
  entityPlural: string;
  /** Rendered when there are zero items at all — wording differs per entity. */
  emptyMessage: ReactNode;
}

/**
 * The shared status row for a taxonomy listing page: a filtered-count summary, loading / error
 * states, an empty state, and a "no match" message. Extracted so each listing (Categories /
 * Websites / YouTube Channels / …) renders the identical block from one place instead of repeating
 * the same five conditionals — and so the listing components stay under the complexity cap.
 */
export function ListingStatusMessages({
  isLoading,
  error,
  totalCount,
  filteredCount,
  rawQuery,
  hasQuery,
  loadingLabel,
  entityPlural,
  emptyMessage,
}: ListingStatusMessagesProps) {
  return (
    <>
      {hasQuery && filteredCount < totalCount
        ? (
          <p className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount}
          </p>
        )
        : null}

      {isLoading ? <p className="text-muted-foreground">{loadingLabel}</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      {!isLoading && totalCount === 0 ? emptyMessage : null}

      {!isLoading && totalCount > 0 && filteredCount === 0
        ? (
          <p className="text-muted-foreground">
            No {entityPlural} match &ldquo;{rawQuery}&rdquo;.
          </p>
        )
        : null}
    </>
  );
}
