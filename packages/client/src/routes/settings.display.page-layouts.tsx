import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PageLayoutsSettings } from "../components/PageLayoutsSettings";

export const Route = createFileRoute("/settings/display/page-layouts")({
  component: DisplayPageLayoutsPage,
});

function DisplayPageLayoutsPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("Page Layouts")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Customize how an entity's view and edit tabs, sections, and fields are arranged.")}
        </p>
      </div>

      <PageLayoutsSettings />
    </section>
  );
}
