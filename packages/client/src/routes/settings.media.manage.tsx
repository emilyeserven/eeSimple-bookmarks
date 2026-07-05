import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { GalleryListing } from "../components/GalleryManager";

export const Route = createFileRoute("/settings/media/manage")({
  component: ManageMediaPage,
});

function ManageMediaPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Manage Media")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "Every image stored in the bucket. Run a scan to catalog what's in storage. When a bookmark is deleted its image is preserved here as an orphan — use \"Attach\" to re-link it to another bookmark, or delete it to reclaim the space.",
          )}
        </p>
      </div>
      <GalleryListing />
    </section>
  );
}
