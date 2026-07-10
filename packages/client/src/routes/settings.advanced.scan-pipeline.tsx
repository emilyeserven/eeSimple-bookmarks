import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ScanPipelineSettings } from "../components/ScanPipelineSettings";

export const Route = createFileRoute("/settings/advanced/scan-pipeline")({
  component: ScanPipelinePage,
});

function ScanPipelinePage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Scan Pipeline")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "How a pasted URL is processed into bookmark metadata, and which steps are currently active. View-only — the description comes from the server.",
          )}
        </p>
      </div>
      <ScanPipelineSettings />
    </section>
  );
}
