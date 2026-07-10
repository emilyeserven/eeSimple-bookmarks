import type { ScanCacheStats } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function StatTile({
  label, value,
}: { label: string;
  value: string; }) {
  return (
    <div className="rounded-md border bg-muted/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** Live stats for the short-TTL in-memory scan cache (entries / cap / TTL). */
export function ScanCacheStatsCard({
  cache,
}: { cache: ScanCacheStats }) {
  const {
    t,
  } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Scan cache")}</CardTitle>
        <CardDescription>
          {t(
            "Recent scan results are kept in memory briefly so re-scanning the same URL is instant. Scans that carry identity fields (ISBN, Plex, Kavita, feed URL) skip the cache entirely.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="
            grid gap-3
            sm:grid-cols-3
          "
        >
          <StatTile
            label={t("Cached scans")}
            value={cache.entries.toLocaleString()}
          />
          <StatTile
            label={t("Maximum entries")}
            value={cache.maxEntries.toLocaleString()}
          />
          <StatTile
            label={t("Time to live")}
            value={t("{{seconds}}s", {
              seconds: Math.round(cache.ttlMs / 1000),
            })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
