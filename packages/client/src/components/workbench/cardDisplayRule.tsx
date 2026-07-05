import type { EntityWorkbench } from "./types";
import type { CardDisplayRule } from "@eesimple/types";

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
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name and description."),
        render: CardDisplayRuleGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name and description."),
        render: CardDisplayRuleGeneralForm,
      },
    },
    {
      key: "conditions",
      label: "Conditions",
      // The Default rule matches every card unconditionally, so it has no conditions to edit.
      showIf: rule => !rule.isDefault,
      view: {
        title: i18n.t("Conditions"),
        description: i18n.t("Which bookmarks this rule applies to."),
        render: CardDisplayRuleConditionsView,
      },
      edit: {
        title: i18n.t("Conditions"),
        description: i18n.t("Configure which bookmarks this rule applies to."),
        render: CardDisplayRuleConditionsForm,
      },
    },
    {
      key: "display",
      label: "Display",
      view: {
        title: i18n.t("Display"),
        description: i18n.t("How matching bookmark cards are shown."),
        render: CardDisplayRuleDisplayView,
      },
      edit: {
        title: i18n.t("Display"),
        description: i18n.t("Card field placement and image presentation. Unset attributes inherit from lower-priority rules."),
        render: CardDisplayRuleDisplayForm,
      },
    },
  ],
};
