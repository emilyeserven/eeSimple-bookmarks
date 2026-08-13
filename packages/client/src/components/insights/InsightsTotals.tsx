import type { CollectionInsightsTotals } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** One headline stat tile; the whole tile links to the listing the number counts. */
function TotalTile({
  label,
  value,
  to,
  destructive = false,
}: {
  label: string;
  value: number;
  /** Listing page this stat counts, e.g. `/categories`. */
  to: string;
  /** Colors the number as a problem count (the non-zero broken-links tile). */
  destructive?: boolean;
}) {
  return (
    <Link
      to={to as never}
      className="
        rounded-xl
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
      "
    >
      <Card
        className="
          h-full transition-colors
          hover:border-primary/40 hover:bg-accent/40
        "
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={destructive
              ? "text-2xl font-semibold text-destructive tabular-nums"
              : "text-2xl font-semibold tabular-nums"}
          >
            {value.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * The five headline totals, each tile linking to the listing it counts (the broken-links tile goes
 * to Link Health, and reads destructive once there is anything to fix).
 */
export function InsightsTotals({
  totals,
}: {
  totals: CollectionInsightsTotals;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div
      className="
        grid gap-4
        sm:grid-cols-2
        lg:grid-cols-5
      "
    >
      <TotalTile
        label={t("Bookmarks")}
        value={totals.bookmarks}
        to="/bookmarks"
      />
      <TotalTile
        label={t("Categories")}
        value={totals.categories}
        to="/categories"
      />
      <TotalTile
        label={t("Tags")}
        value={totals.tags}
        to="/tags"
      />
      <TotalTile
        label={t("Websites")}
        value={totals.websites}
        to="/taxonomies/websites"
      />
      <TotalTile
        label={t("Broken links")}
        value={totals.brokenLinks}
        to="/settings/advanced/link-health"
        destructive={totals.brokenLinks > 0}
      />
    </div>
  );
}
