import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RedirectFailuresSettings } from "../components/RedirectFailuresSettings";

export const Route = createFileRoute("/settings/automations/redirect-failures")({
  component: RedirectFailuresPage,
});

function RedirectFailuresPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Redirect failures")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "Bookmarks whose website is flagged for unreliable redirect resolution. Enter the correct URL for each bookmark to re-fetch its title, description, and image.",
          )}
        </p>
      </div>
      <RedirectFailuresSettings />
    </section>
  );
}
