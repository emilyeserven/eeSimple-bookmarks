import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BackupSettings } from "../components/backups/BackupSettings";

export const Route = createFileRoute("/settings/advanced/backups")({
  component: BackupsPage,
});

function BackupsPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Backups")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Dump the database on a schedule and send it to another computer on your Tailscale network.")}
        </p>
      </div>
      <BackupSettings />
    </section>
  );
}
