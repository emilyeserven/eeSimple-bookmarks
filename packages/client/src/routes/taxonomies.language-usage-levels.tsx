import { createFileRoute } from "@tanstack/react-router";

import { LanguageUsageLevelsManager } from "../components/LanguageUsageLevelsManager";

export const Route = createFileRoute("/taxonomies/language-usage-levels")({
  component: LanguageUsageLevelsPage,
});

function LanguageUsageLevelsPage() {
  return <LanguageUsageLevelsManager />;
}
