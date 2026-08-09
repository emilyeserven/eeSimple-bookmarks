import type { InsightsMonthPoint } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useAppLocale } from "../../hooks/useAppLocale";
import { formatInsightsMonth } from "../../lib/insightsFormat";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Hand-rolled 12-month column chart of bookmark creations (no chart dependency). */
export function MonthlyAddedChart({
  points,
}: {
  points: InsightsMonthPoint[];
}) {
  const {
    t,
  } = useTranslation();
  const locale = useAppLocale();
  const max = Math.max(1, ...points.map(point => point.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Bookmarks added per month")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-32 items-end gap-1">
          {points.map((point) => {
            const percent = Math.round((point.count / max) * 100);
            return (
              <div
                key={point.month}
                className="
                  flex h-full flex-1 items-end overflow-hidden rounded-sm
                  bg-muted
                "
                title={`${formatInsightsMonth(point.month, locale)}: ${point.count.toLocaleString()}`}
                aria-label={`${formatInsightsMonth(point.month, locale)}: ${point.count.toLocaleString()}`}
              >
                <div
                  className="w-full rounded-sm bg-primary"
                  style={{
                    height: point.count > 0 ? `max(${percent}%, 2px)` : "0",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-1">
          {points.map(point => (
            <span
              key={point.month}
              className="
                flex-1 truncate text-center text-xs text-muted-foreground
              "
            >
              {formatInsightsMonth(point.month, locale)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
