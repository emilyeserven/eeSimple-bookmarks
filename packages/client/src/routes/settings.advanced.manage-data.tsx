import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { OrphanCleanupCard } from "../components/OrphanCleanupCard";

export const Route = createFileRoute("/settings/advanced/manage-data")({
  component: ManageDataPage,
});

function ManageDataPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Manage Data")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Clean up orphaned records left behind when their parent is deleted.")}
        </p>
      </div>
      <OrphanCleanupCard />
    </section>
  );
}
