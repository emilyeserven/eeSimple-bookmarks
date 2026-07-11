import { createFileRoute } from "@tanstack/react-router";

import { ParseTemplatesManager } from "../components/ParseTemplatesManager";

export const Route = createFileRoute("/settings/parse-templates")({
  component: ParseTemplatesManager,
});
