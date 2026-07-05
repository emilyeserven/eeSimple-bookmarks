import type { EntityDescriptor } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { CardDisplayRule, UpdateCardDisplayRuleInput } from "@eesimple/types";

import { cardDisplayRuleWorkbench } from "../components/workbench/cardDisplayRule";
import i18n from "../i18n";
import { cardDisplayRulesApi } from "../lib/api/settings";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const CARD_DISPLAY_RULE_ROUTE: EntityRoute = {
  kind: "card-display-rule",
  prefix: "/card-display-rules",
  slugIndex: 1,
  listLabel: i18n.t("Card Display Rules"),
  singular: i18n.t("Card Display Rule"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const CARD_DISPLAY_RULE_PALETTE: EntityPaletteConfig = {
  queryKey: ["card-display-rules"],
  listFn: () => cardDisplayRulesApi.list(),
  updateFn: (id, patch) => cardDisplayRulesApi.update(id, patch as UpdateCardDisplayRuleInput),
  extraEditTabs: [
    {
      label: i18n.t("Edit Conditions"),
      tab: "conditions",
    },
    {
      label: i18n.t("Edit Display"),
      tab: "display",
    },
  ],
};

/**
 * Route/palette/workbench-only `EntityDescriptor` — `listing` is intentionally omitted: the
 * /card-display-rules listing is a dnd-kit priority-ordered, optimistically-reordered list with a
 * pinned non-draggable Default rule, so none of the scaffold's flat shapes apply; it stays bespoke
 * by design (issue #860 batch 3).
 */
export const cardDisplayRuleDescriptor: EntityDescriptor<CardDisplayRule> = {
  kind: "card-display-rule",
  route: CARD_DISPLAY_RULE_ROUTE,
  palette: CARD_DISPLAY_RULE_PALETTE,
  workbench: cardDisplayRuleWorkbench,
};
