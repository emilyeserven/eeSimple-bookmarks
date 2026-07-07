import type { MouseEvent, ReactNode } from "react";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useAutofillScopeDefaults } from "./useAutofillScopeDefaults";
import { AddAutofillRuleModal } from "../components/AddAutofillRuleModal";
import { buildAutofillRulePrefill } from "../lib/autofillPrefill";

/**
 * Drives every "New autofill rule" button. A click opens a name-only modal that creates the rule
 * (with any scope prefill baked in) and navigates to its Conditions edit tab so the user can start
 * editing immediately. Spread `onClick` onto the button and render `modal`. Use `openModal` for
 * non-event contexts like the AppHeader create button.
 */
export function useNewAutofillRule(): {
  onClick: (event: MouseEvent) => void;
  openModal: () => void;
  modal: ReactNode;
} {
  const navigate = useNavigate();
  const defaults = useAutofillScopeDefaults();
  const [modalOpen, setModalOpen] = useState(false);

  const onClick = (_event: MouseEvent) => {
    setModalOpen(true);
  };

  const modal = (
    <AddAutofillRuleModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      prefill={buildAutofillRulePrefill(defaults)}
      onCreated={(rule) => {
        void navigate({
          to: "/autofill/$ruleSlug/edit",
          params: {
            ruleSlug: rule.slug,
          },
          search: {
            tab: "conditions",
          },
        });
      }}
    />
  );

  return {
    onClick,
    openModal: () => setModalOpen(true),
    modal,
  };
}
