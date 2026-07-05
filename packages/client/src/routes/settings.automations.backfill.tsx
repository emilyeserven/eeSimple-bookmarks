import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BackfillSettings } from "../components/BackfillSettings";

export const Route = createFileRoute("/settings/automations/backfill")({
  component: BackfillAutomationsPage,
});

function BackfillAutomationsPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Backfill")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("One-off scans over existing bookmarks and YouTube channels.")}
        </p>
      </div>
      <BackfillSettings />
    </section>
  );
}
