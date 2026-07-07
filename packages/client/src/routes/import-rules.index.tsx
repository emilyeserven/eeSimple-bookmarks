import { useState } from "react";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddImportRuleModal } from "../components/AddImportRuleModal";
import { ListingScaffold } from "../components/ListingScaffold";
import { importRuleListingConfig } from "../entities/importRule";
import { useSetListingPage } from "../hooks/useListingPage";
import { useListingScaffold } from "../hooks/useListingScaffold";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/import-rules/")({
  component: ImportRulesListPage,
});

function ImportRulesListPage() {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("import-rules-listing", {
    createAction: () => setModalOpen(true),
  });
  const state = useListingScaffold(importRuleListingConfig);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{t("Import Rules")}</h2>
          {!state.isLoading
            ? <Badge variant="secondary">{state.items.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Define rules that evaluate each inbox candidate's URL. The first matching rule automatically approves, rejects, or blocks the item. Unmatched items stay pending.")}
          {" "}
          {t("See also")}
          {" "}
          <Link
            to="/settings/automations/imports"
            className="underline"
          >{t("Imports")}
          </Link>
          .
        </p>
      </div>

      <ListingScaffold
        config={importRuleListingConfig}
        state={state}
      />

      <AddImportRuleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(rule) => {
          void navigate({
            to: "/import-rules/$ruleSlug/edit",
            params: {
              ruleSlug: rule.slug,
            },
            search: {
              tab: "conditions",
            },
          });
        }}
      />
    </section>
  );
}
