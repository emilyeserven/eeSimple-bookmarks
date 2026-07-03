import { createFileRoute } from "@tanstack/react-router";

import { LanguageUsageOverview } from "../components/LanguageUsageOverview";

export const Route = createFileRoute("/taxonomies/language-usage-levels/")({
  component: LanguageUsageOverview,
});
