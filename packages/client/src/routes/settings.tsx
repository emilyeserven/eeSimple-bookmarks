import type { TabNavEntry } from "../components/TabbedEntityLayout";

import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  const {
    t,
  } = useTranslation();
  const settingsNav: readonly TabNavEntry[] = [
    {
      to: "/settings/display",
      label: t("Display"),
    },
    {
      to: "/settings/media",
      label: t("Media"),
    },
    {
      to: "/settings/taxonomies",
      label: t("Taxonomies"),
    },
    {
      to: "/settings/automations",
      label: t("Automations"),
    },
    {
      to: "/settings/locations",
      label: t("Locations"),
    },
    {
      to: "/settings/extension",
      label: t("Extension"),
    },
    {
      to: "/settings/page-layouts",
      label: t("Page Layouts"),
    },
    {
      to: "/settings/parse-templates",
      label: t("Parse Templates"),
    },
    {
      to: "/settings/advanced",
      label: t("Advanced"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <div>
          <h1 className="text-2xl font-bold">{t("Settings")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Manage custom properties, display preferences, and automations.")}
          </p>
        </div>
      )}
      nav={settingsNav}
      navAriaLabel={t("Settings sections")}
    />
  );
}
