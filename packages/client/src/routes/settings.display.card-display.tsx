import { createFileRoute } from "@tanstack/react-router";

import { CardDisplaySettings } from "../components/CardDisplaySettings";

export const Route = createFileRoute("/settings/display/card-display")({
  component: CardDisplayPage,
});

function CardDisplayPage() {
  return <CardDisplaySettings />;
}
