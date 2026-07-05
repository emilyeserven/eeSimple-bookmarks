import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { WebsitesListing } from "../components/WebsiteManager";

export const Route = createFileRoute("/settings/websites")({
  component: WebsitesPage,
});

function WebsitesPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Websites")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "The built-in Websites taxonomy. Each site is created automatically from a bookmark's URL; rename a site here to give it a friendly name.",
          )}
        </p>
      </div>
      <WebsitesListing />
    </section>
  );
}
