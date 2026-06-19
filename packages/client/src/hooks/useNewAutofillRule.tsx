import type { MouseEvent, ReactNode } from "react";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useAutofillScopeDefaults } from "./useAutofillScopeDefaults";
import { AddAutofillRuleModal } from "../components/AddAutofillRuleModal";
import { usePanelControls } from "../components/panel/usePanelControls";
import { buildAutofillRulePrefill } from "../lib/autofillPrefill";

import { NEW_SENTINEL } from "@/lib/drawerSearch";
import { hasSidebarModifier } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/**
 * Drives every "New autofill rule" button. A normal click opens a name-only modal that creates the
 * rule (with any scope prefill baked in) and navigates to its Conditions edit tab so the user can
 * start editing immediately. Holding the configured sidebar modifier instead opens the rule in the
 * right drawer, preserving the previous behavior. Spread `onClick` onto the button and render `modal`.
 * Use `openModal` for non-event contexts like the AppHeader create button.
 */
export function useNewAutofillRule(): {
  onClick: (event: MouseEvent) => void;
  openModal: () => void;
  modal: ReactNode;
} {
  const {
    openAutofill,
  } = usePanelControls();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const navigate = useNavigate();
  const defaults = useAutofillScopeDefaults();
  const [modalOpen, setModalOpen] = useState(false);

  const onClick = (event: MouseEvent) => {
    // Holding the configured modifier keeps the old behavior: open the create form in the drawer.
    if (hasSidebarModifier(event, modifier)) {
      openAutofill(NEW_SENTINEL);
      return;
    }
    setModalOpen(true);
  };

  const modal = (
    <AddAutofillRuleModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      prefill={buildAutofillRulePrefill(defaults)}
      onCreated={(rule) => {
        void navigate({
          to: "/autofill/$ruleSlug/edit/conditions",
          params: {
            ruleSlug: rule.slug,
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
