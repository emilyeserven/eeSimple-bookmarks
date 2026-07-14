---
name: display-rules-tab
description: >-
  Clarifies that there is NO entity-scoped "Display Rules" tab in eeSimple Bookmarks, and no
  slug-routed card-display-rule entity. Card display is a single global config
  (Settings → Display → Card Display). Use when asked to "add a Display Rules tab to X", "scope card
  display rules to X", "show which card display rules apply to X", or "edit display rules from X's
  page" — the answer is that this feature does not exist; see below for what actually governs card
  display.
---

# There is no entity-scoped "Display Rules" tab

**This skill previously documented an entity-scoped "Display Rules" tab (a card-display sibling of the
inline Autofill Rules tab). That feature was never landed — it has been removed to stop poisoning
sessions with a fictional recipe.** None of the pieces it described exist in the codebase: no
`display-rules` workbench tab, no `CardDisplayRulesList` / `CardDisplayRuleCard` / `CardDisplayRuleForm`
components, no `useCardDisplayRules` hooks, no `lib/cardDisplayRulesFilter.ts` / `lib/cardDisplayScope.ts`
/ `hooks/useCardDisplayScope.ts`, no `/card-display-rules` route, and no `card-display-rule` entity in
`ENTITY_ROUTES` / `LAYOUTABLE_ENTITY_KINDS`. The `CardDisplayRule` interface still lingers in
`@eesimple/types` as **orphaned type surface** (nothing consumes it as a routed entity).

## What actually governs card display

Card display is a **single global `CardDisplayConfig`** (`@eesimple/types`), edited on **Settings →
Display → Card Display** (`routes/settings.display.card-display.tsx` → `CardDisplaySettings`), seeded/
repaired by the `ensureCardDisplayConfig()` boot step. There is **one config**, not a reorderable list
of per-entity rules and **no layered merge / `sortOrder` priority / Default rule**.

- **Per-bookmark conditions live on each section**, not on an entity-scoped rule. A `CardDisplaySection`
  carries an optional `visibleIf` condition tree; `resolveCardDisplay(bookmark, config, options)`
  (`lib/cardDisplayRules.ts`) filters `config.sections` by that tree for each rendered card. To make a
  section show only for bookmarks referencing some entity, add a condition leaf to that section's
  `visibleIf` — the same shared `evaluateConditions` the filter sidebar / autofill use.
- **Field placement / per-field knobs** — see the `card-field-area` skill (`CardFieldPlacement`,
  `CardDisplaySection`, image corners). That machinery is real and current.
- **Display-only:** the config service (`services/cardDisplayRules.ts`) is CRUD-only and never calls
  `invalidateBookmarkCache()`.

## If you actually want per-entity scoping of card display

There is no supported path today. It would first require turning card display into a slug-routed entity
(field registry + `LAYOUTABLE_ENTITY_KINDS` membership) or adding an entity-scoped condition surface —
a real feature, not a doc fix. For the **autofill** equivalent that *did* land (an inline entity-scoped
Autofill Rules tab + a central `/autofill` filtered page), see the `scope-autofill` and
`tab-to-filtered-page` skills.
