import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddAutofillRuleModal } from "../components/AddAutofillRuleModal";
import { AutofillRulesList } from "../components/AutofillRulesList";
import { useAutofillRules } from "../hooks/useAutofill";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/autofill/")({
  component: AutofillListPage,
});

function AutofillListPage() {
  const {
    data: rules,
  } = useAutofillRules();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("autofill-rules-listing");

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Autofill Rules</h2>
            {rules
              ? <Badge variant="secondary">{rules.length}</Badge>
              : null}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="size-4" />
            New autofill rule
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark&apos;s title or website and prefill its category, tags, and
          custom properties when you add it. Select a rule to edit it, or create a new one.
        </p>
      </div>

      <AutofillRulesList />

      <AddAutofillRuleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(rule) => {
          void navigate({
            to: "/autofill/$ruleSlug/edit/general",
            params: {
              ruleSlug: rule.slug,
            },
          });
        }}
      />
    </section>
  );
}
