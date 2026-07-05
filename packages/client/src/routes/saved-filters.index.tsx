import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SavedFiltersManager } from "../components/SavedFiltersManager";

export const Route = createFileRoute("/saved-filters/")({
  component: SavedFiltersListPage,
});

function SavedFiltersListPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Saved Filters")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "Named filter presets you can apply to any bookmark listing with one click from the filter sidebar.",
          )}
        </p>
      </div>
      <SavedFiltersManager />
    </section>
  );
}
