import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { CustomPropertyManager } from "../components/CustomPropertyManager";

/**
 * Settings fallback for Custom Properties, shown in the Settings nav when the section is hidden
 * from the sidebar's Customization group. The listing links out to the top-level
 * `/custom-properties` pages — the section's primary home.
 */
export const Route = createFileRoute("/settings/custom-properties")({
  component: CustomPropertiesPage,
});

function CustomPropertiesPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Custom Properties")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Define custom properties to attach to bookmarks. Each property becomes a filter on the bookmarks page — a combobox for tiered tags, a range slider for numbers.")}
        </p>
      </div>
      <CustomPropertyManager />
    </section>
  );
}
