import { useState } from "react";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddImportRuleModal } from "../components/AddImportRuleModal";
import { ImportRulesList } from "../components/ImportRulesList";
import { useImportRules } from "../hooks/useImportRules";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";

import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/uiStore";

export const Route = createFileRoute("/import-rules/")({
  component: ImportRulesListPage,
});

function ImportRulesListPage() {
  const {
    data: rules,
  } = useImportRules();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("import-rules-listing", false, false, false, () => setModalOpen(true));
  useRegisterHeaderSearch();
  const query = useUiStore(state => state.headerSearchQuery);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Import Rules</h2>
          {rules
            ? <Badge variant="secondary">{rules.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Define rules that evaluate each inbox candidate&apos;s URL. The first matching rule
          automatically approves, rejects, or blocks the item. Unmatched items stay pending.
          {" "}
          See also
          {" "}
          <Link
            to="/settings/automations/imports"
            className="underline"
          >Imports
          </Link>
          .
        </p>
      </div>

      <ImportRulesList query={query} />

      <AddImportRuleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(rule) => {
          void navigate({
            to: "/import-rules/$ruleSlug/edit/conditions",
            params: {
              ruleSlug: rule.slug,
            },
          });
        }}
      />
    </section>
  );
}
