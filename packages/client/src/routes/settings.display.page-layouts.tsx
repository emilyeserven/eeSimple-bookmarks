import type { LayoutableEntityKind } from "@eesimple/types";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PageLayoutsSettings } from "../components/PageLayoutsSettings";
import { LAYOUT_DRIVEN_ENTITIES } from "../lib/layoutDrivenEntities";
import { validatePageLayoutsSearch } from "../lib/pageLayoutsSearch";

export const Route = createFileRoute("/settings/display/page-layouts")({
  validateSearch: validatePageLayoutsSearch,
  component: DisplayPageLayoutsPage,
});

function DisplayPageLayoutsPage() {
  const {
    t,
  } = useTranslation();
  const {
    entity,
  } = Route.useSearch();
  const navigate = useNavigate();
  const selectedKind = entity ?? LAYOUT_DRIVEN_ENTITIES[0].kind;
  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("Page Layouts")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Customize how an entity's view and edit tabs, sections, and fields are arranged.")}
        </p>
      </div>

      <PageLayoutsSettings
        selectedKind={selectedKind}
        onSelectKind={(kind: LayoutableEntityKind) => void navigate({
          to: "/settings/display/page-layouts",
          search: {
            entity: kind,
          },
          replace: true,
        })}
      />
    </section>
  );
}
