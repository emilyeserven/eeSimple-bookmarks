import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { DuplicatesSettingsCard } from "../components/DuplicatesSettingsCard";

export const Route = createFileRoute("/settings/advanced/duplicates")({
  component: DuplicatesPage,
});

function DuplicatesPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Duplicates")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Find bookmarks saved more than once and merge them into one.")}
        </p>
      </div>
      <DuplicatesSettingsCard />
    </section>
  );
}
