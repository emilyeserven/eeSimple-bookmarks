import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ConnectorsSettings } from "../components/ConnectorsSettings";

export const Route = createFileRoute("/settings/advanced/connectors")({
  component: ConnectorsPage,
});

function ConnectorsPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Connectors")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "The external data sources used to auto-fill bookmark metadata, what each provides, and which optional providers are currently active.",
          )}
        </p>
      </div>
      <ConnectorsSettings />
    </section>
  );
}
