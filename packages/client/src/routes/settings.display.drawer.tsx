import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SidebarSettings } from "../components/SidebarSettings";

export const Route = createFileRoute("/settings/display/drawer")({
  component: DisplayDrawerPage,
});

function DisplayDrawerPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("Drawer")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Control how the right-hand drawer opens.")}
        </p>
      </div>
      <SidebarSettings />
    </section>
  );
}
