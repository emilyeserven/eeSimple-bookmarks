import type { PlexItemResult } from "@eesimple/types";
import type { UseQueryResult } from "@tanstack/react-query";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConnectors } from "./useConnectors";
import { plexApi } from "../lib/api/plex";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

interface UseBookmarkPlexSearchResult {
  /** Live (un-debounced) input value — bind directly to the search `<Input>`. */
  query: string;
  setQuery: (value: string) => void;
  /** Whether the Plex connector is configured — callers render nothing (or fall back) when false. */
  enabled: boolean;
  /** The debounced item search — `data`/`isFetching`/`isError`/`isSuccess`/`error` as usual. */
  search: UseQueryResult<PlexItemResult[]>;
}

/**
 * Debounced Plex item search for the bookmark edit "Plex item" picker. Unlike `PlexItemLookup` (the
 * Movie / TV Show create-form lookup, which narrows to a single Plex family), a bookmark can link
 * any Plex item, so this searches across **all** kinds (no `kind` narrowing). Owns the
 * connector-enabled check, the 300ms debounce, and the `["plex-item-search", query]` query (proxied
 * through the middleware so the token stays server-side) — gated on the connector being enabled and
 * the (trimmed, debounced) query being at least two characters.
 */
export function useBookmarkPlexSearch(): UseBookmarkPlexSearchResult {
  const {
    data: connectors,
  } = useConnectors();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const trimmedQuery = debouncedQuery.trim();
  const enabled = Boolean(connectors?.plex.enabled);
  const search = useQuery({
    queryKey: ["plex-item-search", trimmedQuery],
    queryFn: () => plexApi.searchItems(trimmedQuery),
    enabled: enabled && trimmedQuery.length >= MIN_QUERY_LENGTH,
  });

  return {
    query,
    setQuery,
    enabled,
    search,
  };
}
