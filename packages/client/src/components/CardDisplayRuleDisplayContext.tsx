/* eslint-disable react-refresh/only-export-components -- this file pairs the provider component with
   its `useCardDisplayRuleDisplayContext` reader hook + the shared value type (and the `buildLabels`
   helper), the standard React context module shape */
import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type { CardDisplayRule, CustomProperty, UpdateCardDisplayRuleInput } from "@eesimple/types";
import type { ReactNode } from "react";

import { createContext, useContext } from "react";

import { useCardDisplayRuleDisplay } from "./useCardDisplayRuleDisplay";

import i18n from "@/i18n";

/** Field-named toast labels for each display attribute the granular fields persist. */
export function buildLabels(): Partial<Record<keyof UpdateCardDisplayRuleInput, string>> {
  return {
    fieldZones: i18n.t("Card fields"),
    cardZoneLayouts: i18n.t("Card layout"),
    imageMode: i18n.t("Image aspect"),
    imageVisibility: i18n.t("Image visibility"),
    imageLayout: i18n.t("Image layout"),
    hideWebsiteForYouTube: i18n.t("Website pill on YouTube"),
  };
}

/**
 * Shares the **one** `useCardDisplayRuleDisplay` controller across the card display rule's now-granular
 * Display edit fields (#1198 field extraction). The layout render seam (`LayoutDrivenTabBody`) invokes
 * each field's `edit` renderer as a plain call, so N independent field components would each spin up N
 * separate copies of the controlled `RuleDisplayValue` state and the live preview would fall out of sync.
 * Instead the state + per-attribute auto-save is instantiated **once** here and read by every granular
 * edit field (and the preview field) via {@link useCardDisplayRuleDisplayContext}. View fields need no
 * context — they read the entity directly.
 *
 * Mounted by `EntityEditView` via the workbench descriptor's `editFormProvider` +
 * `sharedFormFieldKeys` (the shared-`useAppForm` extraction seam, #1188 — see `websiteWorkbench` /
 * `cardDisplayRuleWorkbench`), whenever the active edit tab hosts one of the atomized Display fields —
 * so it mounts regardless of which tab an operator relocates them to, and never on the info/view route
 * (the `preview` field's view renderer reads the entity directly). This is the shared-composite →
 * form-context provider pattern — see the `surface-entity-field` skill ("Extraction (reverse
 * direction)").
 */
export interface CardDisplayRuleDisplayContextValue {
  rule: CardDisplayRule;
  display: RuleDisplayValue;
  handleChange: (patch: Partial<RuleDisplayValue>) => void;
  properties: CustomProperty[];
  isDefault: boolean;
}

const CardDisplayRuleDisplayContext = createContext<CardDisplayRuleDisplayContextValue | null>(null);

export function CardDisplayRuleDisplayProvider({
  rule,
  children,
}: {
  rule: CardDisplayRule;
  children: ReactNode;
}) {
  const {
    properties, display, handleChange,
  } = useCardDisplayRuleDisplay(rule, buildLabels());

  return (
    <CardDisplayRuleDisplayContext.Provider
      value={{
        rule,
        display,
        handleChange,
        properties,
        isDefault: rule.isDefault,
      }}
    >
      {children}
    </CardDisplayRuleDisplayContext.Provider>
  );
}

export function useCardDisplayRuleDisplayContext(): CardDisplayRuleDisplayContextValue {
  const value = useContext(CardDisplayRuleDisplayContext);
  if (!value) {
    throw new Error("useCardDisplayRuleDisplayContext must be used within a CardDisplayRuleDisplayProvider");
  }
  return value;
}
