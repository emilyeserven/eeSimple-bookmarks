import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AiSummarizationSettings } from "../components/AiSummarizationSettings";

export const Route = createFileRoute("/ai-summarization")({
  component: AiSummarizationPage,
});

function AiSummarizationPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("AI Summarization")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Configure a prompt for AI summarization and mark queued bookmarks as summarized.")}
        </p>
      </div>
      <AiSummarizationSettings />
    </section>
  );
}
