import type { BookmarkSearch, InsightsBreakdown } from "@eesimple/types";
import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** One rendered row of a breakdown, already resolved to its link target (if any). */
interface BreakdownRowData {
  key: string;
  name: string;
  count: number;
  /** Full path to the row's own bookmarks page; absent = plain (unlinked) text. */
  to?: string;
  /** `/bookmarks` filter state for the unset row (used with `to: "/bookmarks"`). */
  search?: BookmarkSearch;
  /** The de-emphasized trailing rows: "Other" and the unset bucket. */
  muted?: boolean;
}

/**
 * One breakdown row: name + count over the shared proportional bar (the header-indicator idiom).
 * `scale` is the largest count in the card — not the collection size — so the top row always fills
 * the bar and the smaller rows stay legible; the title still reports the share of the collection.
 */
function BreakdownRow({
  row,
  scale,
  total,
}: {
  row: BreakdownRowData;
  scale: number;
  total: number;
}) {
  const {
    t,
  } = useTranslation();
  const fraction = scale > 0 ? row.count / scale : 0;
  const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
  // Pre-formatted numbers interpolate under names other than `count`, which i18next reserves for
  // plural selection.
  const title = t("{{value}} of {{total}} bookmarks ({{share}}%)", {
    value: row.count.toLocaleString(),
    total: total.toLocaleString(),
    share,
  });
  const nameClass = row.muted ? "truncate text-muted-foreground" : "truncate";
  let name: ReactNode = <span className={nameClass}>{row.name}</span>;
  if (row.to !== undefined) {
    name = (
      <Link
        to={row.to as never}
        search={row.search as never}
        className={`
          ${nameClass}
          underline-offset-4
          hover:underline
        `}
      >
        {row.name}
      </Link>
    );
  }

  return (
    <li
      className="space-y-1"
      title={title}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        {name}
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{row.count.toLocaleString()}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={row.muted
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
 * A top-N breakdown card (By category / By media type / Top websites). Each named row links to that
 * entity's own bookmarks page (`${slicePrefix}/${slug}`) and the unset row to the equivalent
 * "missing" filter on `/bookmarks`; "Other" has no single target and stays plain text. Bars are
 * scaled against the card's own largest row rather than the whole collection.
 */
export function InsightsBreakdownCard({
  title,
  breakdown,
  total,
  noneLabel,
  slicePrefix,
  noneSearch,
}: {
  title: string;
  breakdown: InsightsBreakdown;
  total: number;
  noneLabel: string;
  /** URL prefix owning the sliced entity's pages, e.g. `/categories`. */
  slicePrefix: string;
  /** `/bookmarks` search that isolates the bookmarks counted in `noneCount`. */
  noneSearch: BookmarkSearch;
}) {
  const {
    t,
  } = useTranslation();

  const rows: BreakdownRowData[] = breakdown.slices.map(slice => ({
    key: slice.id,
    name: slice.name,
    count: slice.count,
    to: slice.slug === null ? undefined : `${slicePrefix}/${slice.slug}`,
  }));
  if (breakdown.otherCount > 0) {
    rows.push({
      key: "__other",
      name: t("Other"),
      count: breakdown.otherCount,
      muted: true,
    });
  }
  if (breakdown.noneCount > 0) {
    rows.push({
      key: "__none",
      name: noneLabel,
      count: breakdown.noneCount,
      to: "/bookmarks",
      search: noneSearch,
      muted: true,
    });
  }
  const scale = Math.max(1, ...rows.map(row => row.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0
          ? <p className="text-sm text-muted-foreground">{t("No bookmarks yet.")}</p>
          : (
            <ul className="space-y-3">
              {rows.map(row => (
                <BreakdownRow
                  key={row.key}
                  row={row}
                  scale={scale}
                  total={total}
                />
              ))}
            </ul>
          )}
      </CardContent>
    </Card>
  );
}
