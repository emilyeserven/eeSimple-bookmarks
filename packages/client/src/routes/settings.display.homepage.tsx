import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { HomepageContentSettings } from "../components/HomepageContentSettings";
import { HomepageSectionsSettings } from "../components/HomepageSectionsSettings";

import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings/display/homepage")({
  component: DisplayHomepagePage,
});

function DisplayHomepagePage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("Homepage")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Configure the content and sections that appear on your homepage.")}
        </p>
      </div>

      <HomepageContentSettings />

      <Separator />

      <div>
        <h3 className="text-sm font-semibold">{t("Sections")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("Each section shows bookmarks matching its filter, in the order you set here. Drag to reorder.")}
        </p>
      </div>
      <HomepageSectionsSettings />
    </section>
  );
}
