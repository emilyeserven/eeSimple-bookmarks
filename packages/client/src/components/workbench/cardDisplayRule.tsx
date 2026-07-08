import type { EntityWorkbench, WorkbenchField } from "./types";
import type { CardDisplayRule, EntityLayout } from "@eesimple/types";

import i18n from "../../i18n";
import { CardDisplayRuleConditionsForm } from "../CardDisplayRuleConditionsForm";
import { CardDisplayRuleDisplayForm } from "../CardDisplayRuleDisplayForm";
import { CardDisplayRuleGeneralForm } from "../CardDisplayRuleGeneralForm";
import {
  CardDisplayRuleConditionsView,
  CardDisplayRuleDisplayView,
  CardDisplayRuleGeneralView,
} from "../CardDisplayRuleViews";

import { useCardDisplayRuleById, useCardDisplayRuleBySlug, useDeleteCardDisplayRule } from "@/hooks/useCardDisplayRules";

/**
 * The card-display-rule workbench's field registry (#1106 layout editor). Each existing tab pane
 * becomes ONE placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key — the
 * composite-editor recipe (#1165): `display`'s edit renderer is the card-field-zone + image
 * presentation editor, kept as one opaque block. The former tab-level
 * `showIf: rule => !rule.isDefault` (the Default rule matches every card unconditionally, so it has
 * no conditions to edit) moves onto the `conditions` field itself. Authored as an exhaustive
 * `Record<CardDisplayRuleFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type CardDisplayRuleFieldKey
  = | "general"
    | "conditions"
    | "display";

const cardDisplayRuleFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: CardDisplayRuleGeneralView,
    edit: CardDisplayRuleGeneralForm,
  },
  conditions: {
    key: "conditions",
    label: i18n.t("Conditions"),
    showIf: rule => !rule.isDefault,
    view: CardDisplayRuleConditionsView,
    edit: CardDisplayRuleConditionsForm,
  },
  display: {
    key: "display",
    label: i18n.t("Display"),
    view: CardDisplayRuleDisplayView,
    edit: CardDisplayRuleDisplayForm,
  },
} satisfies Record<CardDisplayRuleFieldKey, WorkbenchField<CardDisplayRule>>;

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const CARD_DISPLAY_RULE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies CardDisplayRuleFieldKey[],
      }],
    },
    {
      key: "conditions",
      label: i18n.t("Conditions"),
      sections: [{
        key: "conditions",
        fields: ["conditions"] satisfies CardDisplayRuleFieldKey[],
      }],
    },
    {
      key: "display",
      label: i18n.t("Display"),
      sections: [{
        key: "display",
        fields: ["display"] satisfies CardDisplayRuleFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a card display rule's tabbed view/edit UI (main pane routes + right panel). */
export const cardDisplayRuleWorkbench: EntityWorkbench<CardDisplayRule> = {
  useBySlug: (slug) => {
    const {
      rule, isLoading,
    } = useCardDisplayRuleBySlug(slug);
    return {
      entity: rule,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      rule, isLoading, error,
    } = useCardDisplayRuleById(id);
    return {
      entity: rule,
      isLoading,
      error: error ?? null,
    };
  },
  name: rule => rule.name,
  canDelete: rule => !rule.isDefault,
  useDelete: () => {
    const mutation = useDeleteCardDisplayRule();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Card display rule not found."),
  navAriaLabel: i18n.t("Card display rule sections"),
  getSlug: rule => rule.slug,
  layoutKind: "card-display-rule",
  fields: cardDisplayRuleFields,
  defaultLayout: CARD_DISPLAY_RULE_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to satisfy the descriptor's type requirement — a config entity, so no nav groups.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "conditions",
      label: i18n.t("Conditions"),
    },
    {
      key: "display",
      label: i18n.t("Display"),
    },
  ],
};
