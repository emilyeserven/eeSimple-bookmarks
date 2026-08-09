import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { InsightsPage } from "../components/insights/InsightsPage";

export const Route = createFileRoute("/insights")({
  component: InsightsRoute,
});

function InsightsRoute() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Insights")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Your bookmark collection at a glance — growth over time and how it breaks down.")}
        </p>
      </div>
      <InsightsPage />
    </section>
  );
}
