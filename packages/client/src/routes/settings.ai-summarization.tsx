import { createFileRoute } from "@tanstack/react-router";

import { AiSummarizationSettings } from "../components/AiSummarizationSettings";

export const Route = createFileRoute("/settings/ai-summarization")({
  component: AiSummarizationPage,
});

function AiSummarizationPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">AI Summarization</h2>
        <p className="text-sm text-muted-foreground">
          Configure a prompt for AI summarization and mark queued bookmarks as summarized.
        </p>
      </div>
      <AiSummarizationSettings />
    </section>
  );
}
