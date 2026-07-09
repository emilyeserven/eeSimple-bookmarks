import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TaxonomiesManager } from "../components/TaxonomiesManager";

/**
 * Settings → Taxonomies: create and configure user-configurable taxonomies (hierarchical/flat,
 * single/multi-value, sidebar visibility, custom page layout), manage their terms, and demote a
 * taxonomy back into Tags. Promoting a tag into a taxonomy lives on the Tag's own edit page.
 */
export const Route = createFileRoute("/settings/taxonomies")({
  component: TaxonomiesPage,
});

function TaxonomiesPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Taxonomies")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Create your own classification dimensions. A taxonomy gets its own sidebar item and its own picker on the bookmark form, and can be attached to bookmarks and other taxonomy entities. Promote a tag into a taxonomy from the tag's edit page; demote one back into tags here.")}
        </p>
      </div>
      <TaxonomiesManager />
    </section>
  );
}
