import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LinkHealthCard } from "../components/LinkHealthCard";

export const Route = createFileRoute("/settings/advanced/link-health")({
  component: LinkHealthPage,
});

function LinkHealthPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Link Health")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Find bookmarks whose links no longer work.")}
        </p>
      </div>
      <LinkHealthCard />
    </section>
  );
}
