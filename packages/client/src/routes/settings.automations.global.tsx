import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AutomationsSettings } from "../components/AutomationsSettings";

export const Route = createFileRoute("/settings/automations/global")({
  component: GlobalAutomationsPage,
});

function GlobalAutomationsPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Global")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Automatic behaviors applied whenever you save a bookmark.")}
        </p>
      </div>
      <AutomationsSettings />
    </section>
  );
}
