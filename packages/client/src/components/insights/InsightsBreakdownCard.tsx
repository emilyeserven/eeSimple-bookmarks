import type { InsightsBreakdown } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** One breakdown row: name + count over the shared proportional bar (the header-indicator idiom). */
function BreakdownRow({
  name,
  count,
  total,
  muted = false,
}: {
  name: string;
  count: number;
  total: number;
  muted?: boolean;
}) {
  const fraction = total > 0 ? count / total : 0;
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className={muted ? "truncate text-muted-foreground" : "truncate"}>{name}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{count.toLocaleString()}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={muted
            ? "h-full rounded-full bg-muted-foreground/40"
            : "h-full rounded-full bg-primary"}
          style={{
            width: `${Math.round(fraction * 100)}%`,
          }}
        />
      </div>
    </li>
  );
}

/**
 * A top-N breakdown card (By category / By media type / Top websites): proportional bars against
 * the whole collection, with muted trailing rows for the tail and the unset bookmarks.
 */
export function InsightsBreakdownCard({
  title,
  breakdown,
  total,
  noneLabel,
}: {
  title: string;
  breakdown: InsightsBreakdown;
  total: number;
  noneLabel: string;
}) {
  const {
    t,
  } = useTranslation();
  const isEmpty = breakdown.slices.length === 0 && breakdown.otherCount === 0 && breakdown.noneCount === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty
          ? <p className="text-sm text-muted-foreground">{t("No bookmarks yet.")}</p>
          : (
            <ul className="space-y-3">
              {breakdown.slices.map(slice => (
                <BreakdownRow
                  key={slice.id}
                  name={slice.name}
                  count={slice.count}
                  total={total}
                />
              ))}
              {breakdown.otherCount > 0 && (
                <BreakdownRow
                  name={t("Other")}
                  count={breakdown.otherCount}
                  total={total}
                  muted
                />
              )}
              {breakdown.noneCount > 0 && (
                <BreakdownRow
                  name={noneLabel}
                  count={breakdown.noneCount}
                  total={total}
                  muted
                />
              )}
            </ul>
          )}
      </CardContent>
    </Card>
  );
}
