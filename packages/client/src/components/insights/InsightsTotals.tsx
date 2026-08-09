import type { CollectionInsightsTotals } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** One headline stat tile. */
function TotalTile({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

/** The five headline totals; the broken-links tile links to Link Health when non-zero. */
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
      />
      <TotalTile
        label={t("Categories")}
        value={totals.categories}
      />
      <TotalTile
        label={t("Tags")}
        value={totals.tags}
      />
      <TotalTile
        label={t("Websites")}
        value={totals.websites}
      />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("Broken links")}</CardTitle>
        </CardHeader>
        <CardContent>
          {totals.brokenLinks > 0
            ? (
              <Link
                to="/settings/advanced/link-health"
                className="
                  text-2xl font-semibold text-destructive tabular-nums
                  underline-offset-4
                  hover:underline
                "
              >
                {totals.brokenLinks.toLocaleString()}
              </Link>
            )
            : <p className="text-2xl font-semibold tabular-nums">0</p>}
        </CardContent>
      </Card>
    </div>
  );
}
