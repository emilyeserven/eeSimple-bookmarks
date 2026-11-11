import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { MymindImportPanel } from "../components/MymindImportPanel";

export const Route = createFileRoute("/settings/advanced/import-bookmarks")({
  component: ImportBookmarksPage,
});

function ImportBookmarksPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Import Bookmarks")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Bring bookmarks in from another service.")}
        </p>
      </div>
      <MymindImportPanel />
    </section>
  );
}
