import { useTranslation } from "react-i18next";

import { InsightsBreakdownCard } from "./InsightsBreakdownCard";
import { InsightsTotals } from "./InsightsTotals";
import { MonthlyAddedChart } from "./MonthlyAddedChart";
import { useCollectionInsights } from "../../hooks/useCollectionInsights";

/** The Collection Insights dashboard body: totals, growth chart, and the three breakdowns. */
export function InsightsPage() {
  const {
    t,
  } = useTranslation();
  const {
    data, isLoading, error,
  } = useCollectionInsights();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("Loading…")}</p>;
  }
  if (error || !data) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("Couldn't load insights: {{message}}", {
          message: error instanceof Error ? error.message : t("Unknown error"),
        })}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <InsightsTotals totals={data.totals} />
      <MonthlyAddedChart points={data.addedPerMonth} />
      <div
        className="
          grid gap-4
          lg:grid-cols-3
        "
      >
        <InsightsBreakdownCard
          title={t("By category")}
          breakdown={data.byCategory}
          total={data.totals.bookmarks}
          noneLabel={t("Uncategorized")}
        />
        <InsightsBreakdownCard
          title={t("By media type")}
          breakdown={data.byMediaType}
          total={data.totals.bookmarks}
          noneLabel={t("No media type")}
        />
        <InsightsBreakdownCard
          title={t("Top websites")}
          breakdown={data.topWebsites}
          total={data.totals.bookmarks}
          noneLabel={t("No website")}
        />
      </div>
    </div>
  );
}
