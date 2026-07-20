import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AiBulkEditPage } from "../components/AiBulkEditPage";

export const Route = createFileRoute("/ai-bulk-edit")({
  component: AiBulkEditRoute,
});

function AiBulkEditRoute() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("AI Bulk Edit")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Generate a prompt to update fields across many bookmarks with an AI, then review and apply its suggestions.")}
        </p>
      </div>
      <AiBulkEditPage />
    </section>
  );
}
