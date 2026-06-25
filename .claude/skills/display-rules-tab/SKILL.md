---
name: display-rules-tab
description: >-
  Maintain the entity-scoped "Display Rules" tab in eeSimple Bookmarks — an inline tab on a taxonomy
  entity (Categories / Tags / Websites / Media Types / YouTube Channels / Custom Properties) that lists
  the card display rules whose conditions reference that item and lets you edit them in place. Use when
  asked to "add a Display Rules tab to X", "show which card display rules apply to X", "let me edit
  display rules from X's page", "scope card display rules to X", or to add display-rule scoping for a
  NEW entity. The card-display sibling of the inline Autofill Rules tab (see `scope-autofill`).
---

# The entity-scoped "Display Rules" tab (inline)

Card Display Rules (`CardDisplayRule`, `Settings → Card Display Rules`) change how bookmark **cards**
look (field zones, image presentation, zone layout) for the bookmarks a rule's `conditions` tree
matches. A taxonomy entity's **Display Rules** tab surfaces the non-Default rules whose conditions
reference that entity — the card-display sibling of the **Autofill Rules** tab (see `scope-autofill`).

**This is an inline tab.** The scoped list renders directly on the entity's view/edit pages (and in
the right panel) via the entity's **`EntityWorkbench` descriptor**, not by redirecting to a Settings
page. The central `Settings → Card Display Rules` page (`/card-display-rules`) still exists as the
global, drag-sortable list and a deeplinkable filtered view (`?scope=…&scopeSlug=…`, see
`lib/cardDisplayScope.ts` / `hooks/useCardDisplayScope.ts`) — but the per-entity tab no longer uses it.

Two things make this different from the Autofill tab — keep them straight:

- **Condition-only.** Card display rules have **no "set" actions** (unlike autofill's
  `setCategoryId` / `tagIds` / value arrays). So *every* entity scope here is matched by walking the
  rule's `conditions` tree for a referencing leaf — there is no action-based scoping branch.
- **No individual pages, edited in place.** Card display rules have **no slug/detail pages** (they are
  modeled on `homepage_sections`). The tab renders matching rules with the inline auto-saving editor
  (`CardDisplayRuleCard` → `CardDisplayRuleForm`); never build a tab-only editor. Rule priority
  (`sortOrder`) is **global**, reordered only on the unscoped Settings page. Rules are **display-only**
  — they never call `invalidateBookmarkCache()`.

## The leaf → entity mapping

A rule "applies to" an entity iff its `conditions` tree contains a leaf referencing it:

| Entity         | Condition leaf                                   | List scope prop | Central scope type |
|----------------|--------------------------------------------------|-----------------|--------------------|
| Category       | `{ type: "category", categoryIds }`              | `categoryId`    | `category`         |
| Custom Property| `{ type: "property", propertyId, predicate }`    | `propertyId`    | `property`         |
| Website        | `{ type: "website", domains }` (by **domain**)   | `websiteId`     | `website`          |
| Tag            | `{ type: "tag", tagIds }` (exact, no cascade)    | `tagId`         | `tag`              |
| Media Type     | `{ type: "media-type", mediaTypeIds }`           | `mediaTypeId`   | `media-type`       |
| YouTube Channel| `{ type: "youtube-channel", channelIds }`        | `channelId`     | `channel`          |

## How the inline tab is wired (already in place)

- **Workbench tab** — each `components/workbench/<entity>.tsx` descriptor has a `{ key: "display-rules",
  label: "Display Rules" }` tab whose `view` **and** `edit` panes render
  `<CardDisplayRulesList <scope>={entity.id} />`. This single source drives both the main-pane route and
  the right panel.
- **Route tabs** — each `<entity>.$<slug>.{_view,edit}.display-rules.tsx` is a thin `WorkbenchRouteTab`
  delegation (`tabKey="display-rules"`, `mode="view"|"edit"`), mirroring the entity's `…general` route.
- **Nav** — the `viewNav`/`editNav` arrays in the entity's `_view.tsx`/`edit.tsx` layouts carry a
  `"Rules"` group with `{ to: ".../display-rules", label: "Display Rules" }`, and the `VIEW_TO_EDIT` map
  has a `"display-rules"` entry.
- **List component** — `components/CardDisplayRulesList.tsx`: takes the entity scope prop, filters
  non-Default rules through the predicate, shows a scoped empty message, and an "Add display rule"
  button pre-scoped via `seedCardDisplayConditions`.
- **Filter predicate + seed** — `lib/cardDisplayRulesFilter.ts`: `ruleReferences<Entity>(rule, id)`
  (via the shared `anyLeaf` walker; websites resolve by `normalizeDomain`) and the
  `seedCardDisplayConditions(scope)` branch that pre-scopes a rule created from the tab.
- **Central page (still global only)** — `routes/card-display-rules.tsx` +
  `lib/cardDisplayScope.ts` + `hooks/useCardDisplayScope.ts` power the unscoped drag-sortable list and a
  `?scope=…` deeplink. Independent of the per-entity tab; keep it.

## Adding the Display Rules tab to a NEW entity

1. **Filter predicate + seed** — `lib/cardDisplayRulesFilter.ts`: add `ruleReferences<Entity>(rule,
   id)` and a `seedCardDisplayConditions` branch (property leaves seed a `presence: has` predicate
   keyed by `propertyValueKind`, see `lib/propertyConditionKind.ts`). Cover it in
   `lib/cardDisplayRulesFilter.test.ts`.
2. **List scope prop** — `components/CardDisplayRulesList.tsx`: add the scope prop, filter non-Default
   rules through the new predicate, a scoped empty message, and the new id in its inline
   `seedCardDisplayConditions` scope. Keep it a flat wiring component under fallow's complexity cap.
3. **Workbench tab** — add a `{ key: "display-rules", label: "Display Rules" }` tab to the entity's
   `components/workbench/<entity>.tsx`, both `view` and `edit` panes rendering
   `<CardDisplayRulesList <scope>={entity.id} />`.
4. **Route tabs + nav** — add `<entity>.$<slug>._view.display-rules.tsx` and `.edit.display-rules.tsx`
   as `WorkbenchRouteTab` delegations (copy the entity's `…general` pair, change `tabKey` to
   `"display-rules"`), add a `{ to: ".../display-rules", label: "Display Rules" }` entry to the `"Rules"`
   group in **both** `viewNav`/`editNav`, and a `"display-rules": ".../edit/display-rules"` entry to the
   View file's `VIEW_TO_EDIT` map.
5. **Regenerate the route tree** — `pnpm --filter=@eesimple/client routeTree` (never hand-edit
   `routeTree.gen.ts`).

> The central-page deeplink (`lib/cardDisplayScope.ts` scope type + `resolveCardDisplayScope` branch) is
> optional for a new entity — add it only if you also want a `/card-display-rules?scope=<entity>` filter.

## Reuse (do not reimplement)

`CardDisplayRulesList`, `CardDisplayRulesSettings`, `CardDisplayRuleCard`, `CardDisplayRuleForm`,
`CardDisplayRuleDisplaySettings`, `CardFieldZoneBoard`, `ConditionsField` — the whole editor stack —
and the `useCardDisplayRules` / `useCreateCardDisplayRule` / `useReorderCardDisplayRules` hooks.
`CardDisplayRuleForm` accepts an optional `seedConditions` prop for the pre-scoped create form.

## Verify

```
pnpm --filter=@eesimple/client routeTree
pnpm typecheck
pnpm test            # incl. lib/cardDisplayRulesFilter.test.ts (+ cardDisplayScope tests if you touched the central deeplink)
pnpm lint:fix        # always from repo root
pnpm fallow health   # CardDisplayRulesList stays under the cognitive-complexity cap
```

Then `pnpm dev`: an entity's **Display Rules** tab (View or Edit) lists, inline, only the non-Default
rules referencing that item (correct scoped empty message); expanding a card auto-saves (toast fires)
and the same edit shows on the unscoped Settings page; "Add display rule" creates a rule pre-scoped to
the item; the right panel shows the same tab; a rule referencing a *different* item does not appear.
