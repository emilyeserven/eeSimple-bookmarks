import type { KavitaSeriesResult } from "@eesimple/types";
import type { UseQueryResult } from "@tanstack/react-query";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConnectors } from "./useConnectors";
import { kavitaApi } from "../lib/api/kavita";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

interface UseKavitaSeriesSearchResult {
  /** Live (un-debounced) input value — bind directly to the search `<Input>`. */
  query: string;
  setQuery: (value: string) => void;
  /** Whether the Kavita connector is configured — callers render nothing (or fall back) when false. */
  enabled: boolean;
  /** The connected server's base URL, when configured — for building deep links. */
  baseUrl: string | null;
  /** The debounced series search — `data`/`isFetching`/`isError`/`isSuccess`/`error` as usual. */
  search: UseQueryResult<KavitaSeriesResult[]>;
}

/**
 * Debounced Kavita series search shared by `BookmarkKavitaField` (the bookmark edit "Kavita series"
 * picker) and `KavitaSeriesLookup` (the Book create/edit form's lookup). Owns the connector-enabled
 * check, the 300ms debounce, and the `["kavita-series-search", query]` query (proxied through the
 * middleware so the API key stays server-side) — gated on the connector being enabled and the
 * (trimmed, debounced) query being at least two characters.
 */
export function useKavitaSeriesSearch(): UseKavitaSeriesSearchResult {
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
  const enabled = Boolean(connectors?.kavita.enabled);
  const search = useQuery({
    queryKey: ["kavita-series-search", trimmedQuery],
    queryFn: () => kavitaApi.searchSeries(trimmedQuery),
    enabled: enabled && trimmedQuery.length >= MIN_QUERY_LENGTH,
  });

  return {
    query,
    setQuery,
    enabled,
    baseUrl: connectors?.kavita.enabled ? connectors.kavita.baseUrl : null,
    search,
  };
}
