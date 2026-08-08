import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AiPromptBuilderPage } from "../components/AiPromptBuilderPage";

export const Route = createFileRoute("/ai-prompt-builder")({
  component: AiPromptBuilderRoute,
});

function AiPromptBuilderRoute() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("AI Prompt Builder")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Select bookmarks, ask a question about them, and copy a ready-to-paste prompt for your AI.")}
        </p>
      </div>
      <AiPromptBuilderPage />
    </section>
  );
}
