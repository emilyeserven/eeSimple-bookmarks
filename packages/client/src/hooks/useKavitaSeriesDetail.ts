import { useQuery } from "@tanstack/react-query";

import { useConnectors } from "./useConnectors";

import { kavitaApi } from "@/lib/api/kavita";

const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * A linked series' current live name/release year on Kavita, for flagging drift against a Book's
 * own fields. This is a background hint, not a user-triggered action — a long `staleTime` keeps it
 * from re-hitting the Kavita server on every render/focus, and callers should fail quiet (no toast)
 * on error since a failed background check isn't actionable.
 */
export function useKavitaSeriesDetail(seriesId: number | null) {
  const {
    data: connectors,
  } = useConnectors();
  const enabled = Boolean(connectors?.kavita.enabled) && seriesId !== null;

  return useQuery({
    queryKey: ["kavita-series-detail", seriesId],
    queryFn: () => kavitaApi.getSeriesDetail(seriesId as number),
    enabled,
    staleTime: STALE_TIME_MS,
  });
}
