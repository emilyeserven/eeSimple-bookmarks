import { Link, createFileRoute } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";

import { ImportsBlacklistCard } from "../components/ImportsSettings";

export const Route = createFileRoute("/settings/automations/imports")({
  component: ImportsPage,
});

function ImportsPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Imports")}</h2>
        <p className="text-sm text-muted-foreground">
          <Trans
            i18nKey="Manage the imports blacklist. <link>Import Rules</link> let you auto-approve, reject, or block items by URL pattern."
            components={{
              link: (
                <Link
                  to="/import-rules"
                  className="underline"
                />
              ),
            }}
          />
        </p>
      </div>
      <ImportsBlacklistCard />
    </section>
  );
}
