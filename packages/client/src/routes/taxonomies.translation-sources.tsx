import { createFileRoute } from "@tanstack/react-router";

import { TranslationSourcesManager } from "../components/TranslationSourcesManager";

export const Route = createFileRoute("/taxonomies/translation-sources")({
  component: TranslationSourcesManager,
});
