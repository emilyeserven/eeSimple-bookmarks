import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AiAutotagSettings } from "../components/AiAutotagSettings";

export const Route = createFileRoute("/ai-autotag")({
  component: AiAutotagPage,
});

function AiAutotagPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("AI Autotag")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Generate a prompt to tag untagged bookmarks with an AI, then review and apply its suggestions.")}
        </p>
      </div>
      <AiAutotagSettings />
    </section>
  );
}
