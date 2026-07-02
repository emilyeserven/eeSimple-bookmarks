import type { EntityDescriptor } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { CardDisplayRule, UpdateCardDisplayRuleInput } from "@eesimple/types";

import { cardDisplayRuleWorkbench } from "../components/workbench/cardDisplayRule";
import { cardDisplayRulesApi } from "../lib/api/settings";

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const CARD_DISPLAY_RULE_ROUTE: EntityRoute = {
  kind: "card-display-rule",
  prefix: "/card-display-rules",
  slugIndex: 1,
  listLabel: "Card Display Rules",
  singular: "Card Display Rule",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const CARD_DISPLAY_RULE_PALETTE: EntityPaletteConfig = {
  queryKey: ["card-display-rules"],
  listFn: () => cardDisplayRulesApi.list(),
  updateFn: (id, patch) => cardDisplayRulesApi.update(id, patch as UpdateCardDisplayRuleInput),
  extraEditTabs: [
    {
      label: "Edit Conditions",
      tab: "conditions",
    },
    {
      label: "Edit Display",
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
