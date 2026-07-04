import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { VerticalTabbedLayout } from "../components/VerticalTabbedLayout";

import { mediaNav } from "@/lib/settingsNav";

export const Route = createFileRoute("/settings/media")({
  component: MediaLayout,
});

function MediaLayout() {
  const {
    t,
  } = useTranslation();
  return (
    <VerticalTabbedLayout
      header={(
        <div>
          <h2 className="text-xl font-semibold">Media</h2>
          <p className="text-sm text-muted-foreground">
            Bookmark image/video display, stored media, and screenshot capture defaults.
          </p>
        </div>
      )}
      nav={mediaNav}
      navAriaLabel={t("Media settings sections")}
    />
  );
}
