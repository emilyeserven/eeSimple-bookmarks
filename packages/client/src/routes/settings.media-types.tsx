import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { MediaTypesListing } from "../components/MediaTypeManager";

export const Route = createFileRoute("/settings/media-types")({
  component: MediaTypesPage,
});

function MediaTypesPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Media Types")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "The built-in Media Types taxonomy. Built-in types ship with the app and can't be renamed; add your own custom types here.",
          )}
        </p>
      </div>
      <MediaTypesListing />
    </section>
  );
}
