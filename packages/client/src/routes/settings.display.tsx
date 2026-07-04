import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { VerticalTabbedLayout } from "../components/VerticalTabbedLayout";

import { displayNav } from "@/lib/settingsNav";

export const Route = createFileRoute("/settings/display")({
  component: DisplayLayout,
});

function DisplayLayout() {
  const {
    t,
  } = useTranslation();
  return (
    <VerticalTabbedLayout
      header={(
        <div>
          <h2 className="text-xl font-semibold">Display</h2>
          <p className="text-sm text-muted-foreground">
            Personalize how the app looks.
          </p>
        </div>
      )}
      nav={displayNav}
      navAriaLabel={t("Display settings sections")}
    />
  );
}
