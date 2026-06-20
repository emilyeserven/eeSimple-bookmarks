import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesSettings } from "../components/CardDisplayRulesSettings";

export const Route = createFileRoute("/settings/card-display-rules")({
  component: CardDisplayRulesPage,
});

function CardDisplayRulesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Card Display Rules</h2>
        <p className="text-sm text-muted-foreground">
          Control how bookmark cards display, based on prioritized rules. Drag to set priority.
        </p>
      </div>

      <CardDisplayRulesSettings />
    </section>
  );
}
