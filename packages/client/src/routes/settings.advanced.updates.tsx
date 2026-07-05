import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PwaUpdateCard } from "../components/PwaUpdateCard";

export const Route = createFileRoute("/settings/advanced/updates")({
  component: UpdatesPage,
});

function UpdatesPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Updates")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Check whether a newer version of the app is available.")}
        </p>
      </div>
      <PwaUpdateCard />
    </section>
  );
}
