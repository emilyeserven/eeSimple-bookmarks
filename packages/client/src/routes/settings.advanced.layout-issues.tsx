import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LayoutIssuesSettings } from "../components/LayoutIssuesSettings";

export const Route = createFileRoute("/settings/advanced/layout-issues")({
  component: LayoutIssuesPage,
});

function LayoutIssuesPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Layout Issues")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "Saved page layouts that couldn't be loaded because their stored data is invalid. Each fell back to its built-in default. Copy the debug info to get one fixed, or reset it to clear the corrupted layout.",
          )}
        </p>
      </div>
      <LayoutIssuesSettings />
    </section>
  );
}
