import { createFileRoute } from "@tanstack/react-router";

import { DisplayLanguagesSettings } from "../components/DisplayLanguagesSettings";

export const Route = createFileRoute("/settings/display/languages")({
  component: DisplayLanguagesPage,
});

function DisplayLanguagesPage() {
  return <DisplayLanguagesSettings />;
}
