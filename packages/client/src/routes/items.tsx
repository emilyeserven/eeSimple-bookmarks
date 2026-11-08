import { createFileRoute } from "@tanstack/react-router";

import { ItemsManager } from "@/components/ItemsManager";

export const Route = createFileRoute("/items")({
  component: ItemsManager,
});
