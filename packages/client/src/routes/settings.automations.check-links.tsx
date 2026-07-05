import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { CheckLinkSettings } from "../components/CheckLinkSettings";

export const Route = createFileRoute("/settings/automations/check-links")({
  component: CheckLinksPage,
});

function CheckLinksPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Check links")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "Paste any URL to see which site it resolves to and how it would be canonicalized when saved.",
          )}
        </p>
      </div>
      <CheckLinkSettings />
    </section>
  );
}
