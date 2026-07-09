import type { LayoutableEntityKind } from "@eesimple/types";

import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PageLayoutsSettings } from "../components/PageLayoutsSettings";
import { LAYOUT_DRIVEN_ENTITIES } from "../lib/layoutDrivenEntities";
import { validatePageLayoutsSearch } from "../lib/pageLayoutsSearch";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings/page-layouts")({
  validateSearch: validatePageLayoutsSearch,
  component: PageLayoutsPage,
});

function PageLayoutsPage() {
  const {
    t,
  } = useTranslation();
  const {
    entity,
  } = Route.useSearch();
  const navigate = useNavigate();
  const selectedKind = entity ?? LAYOUT_DRIVEN_ENTITIES[0].kind;
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t("Page Layouts")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("Customize how an entity's view and edit tabs, sections, and fields are arranged.")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setPreviewOpen(open => !open)}
          aria-pressed={previewOpen}
        >
          {previewOpen ? t("Hide preview") : t("Preview")}
        </Button>
      </div>

      <PageLayoutsSettings
        selectedKind={selectedKind}
        onSelectKind={(kind: LayoutableEntityKind) => void navigate({
          to: "/settings/page-layouts",
          search: {
            entity: kind,
          },
          replace: true,
        })}
        previewOpen={previewOpen}
      />
    </section>
  );
}
