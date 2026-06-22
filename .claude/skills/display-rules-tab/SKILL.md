---
name: display-rules-tab
description: >-
  Add or maintain an entity-scoped "Display Rules" tab in eeSimple Bookmarks — a tab on a taxonomy
  entity (Categories / Tags / Websites / Media Types / YouTube Channels / Custom Properties) that
  lists the Card Display Rules whose conditions reference that item and lets the user edit them
  inline, reusing the Card Display settings editor. Use when asked to "add a Display Rules tab to X",
  "show which card display rules apply to X", "let me edit display rules from X's page", or "scope
  card display rules to X". Mirrors how the Autofill Rules tab scopes autofill rules to an entity.
---

# Add a "Display Rules" tab to an entity

Card Display Rules (`CardDisplayRule`, `Settings → Card Display Rules`) change how bookmark **cards**
look (field zones, image presentation, zone layout) for the bookmarks a rule's `conditions` tree
matches. A **Display Rules** tab shows the non-Default rules whose conditions reference the entity in
context and lets the user edit them in place — the card-display sibling of the **Autofill Rules** tab
(see the `scope-autofill` skill).

Two things make this different from the Autofill tab — keep them straight:

- **Condition-only.** Card display rules have **no "set" actions** (unlike autofill's
  `setCategoryId` / `tagIds` / value arrays). So *every* entity scope here is matched by walking the
  rule's `conditions` tree for a referencing leaf — there is no action-based scoping branch.
- **Not sortable, edited in place.** Rule priority (`sortOrder`) is **global**, reordered only on the
  Settings page. The tab renders the matching rules with the **same** inline auto-saving editor the
  Settings page uses (`CardDisplayRuleCard` → `CardDisplayRuleForm`); never build a tab-only editor.
  Editing a rule here updates it everywhere. Rules are **display-only** — they never call
  `invalidateBookmarkCache()`.

For the surrounding vertical-tab layout (`_view` / `edit` route shells, nav arrays, tab wrappers) see
the **`tabbed-pages`** skill, §6 — the route/nav mechanics are identical to the Autofill tab.

## The leaf → entity mapping

A rule "applies to" an entity iff its `conditions` tree contains a leaf referencing it:

| Entity         | Condition leaf                                  | Scope prop     |
|----------------|--------------------------------------------------|----------------|
| Category       | `{ type: "category", categoryIds }`              | `categoryId`   |
| Custom Property| `{ type: "property", propertyId, predicate }`    | `propertyId`   |
| Website        | `{ type: "website", domains }` (by **domain**)   | `websiteId`    |
| Tag            | `{ type: "tag", tagIds }` (exact, no cascade)    | `tagId`        |
| Media Type     | `{ type: "media-type", mediaTypeIds }`           | `mediaTypeId`  |
| YouTube Channel| `{ type: "youtube-channel", channelIds }`        | `channelId`    |

## Steps

1. **Filter predicate** — `packages/client/src/lib/cardDisplayRulesFilter.ts`. Add a
   `ruleReferences<Entity>(rule, id)` that uses the shared `anyLeaf(rule, pred)` walker (group →
   `children.some`, else test the leaf). Websites resolve by **normalized domain**
   (`normalizeDomain`), not id.
2. **Create seed** — in the same file, add a branch to `seedCardDisplayConditions(scope)` so a rule
   created from the tab gets a leaf referencing the entity and immediately lands in the scoped list.
   For a property leaf, seed a `presence: has` predicate keyed by the property's
   `propertyValueKind` (`lib/propertyConditionKind.ts`) so it is well-typed.
3. **List component** — `packages/client/src/components/CardDisplayRulesList.tsx`. Add the scope prop,
   filter non-Default rules through the new predicate (resolve `websiteId → domain` via
   `useWebsites()`; resolve `propertyId`'s value kind via `useCustomProperties()` for the seed), add a
   scoped empty message, and include the new id in the inline `seedCardDisplayConditions` scope. Keep
   it a flat wiring component (hook-dense) under fallow's complexity cap — see the
   "Large-form / over-cap decomposition" note in CLAUDE.md.
4. **Route files** — add `<entity>.$<slug>._view.display-rules.tsx` and
   `<entity>.$<slug>.edit.display-rules.tsx`, each a thin `<Entity>TabWrapper` →
   `<CardDisplayRulesList <scope>={entity.id} />` (copy the entity's existing `*.autofill.tsx` pair,
   drop the `EntityAutofillSources` / `SourceAutofillDefaults` block — there is no display-rule
   analogue).
5. **Nav** — add a `{ to: ".../display-rules", label: "Display Rules" }` entry to **both** the
   `viewNav` and `editNav` arrays in the entity's `_view.tsx` / `edit.tsx` layouts, and a
   `"display-rules": ".../edit/display-rules"` entry to the View file's `VIEW_TO_EDIT` map (so "Edit"
   from the Display Rules view tab stays on Display Rules). Reference:
   `categories.$categorySlug._view.tsx` / `…edit.tsx`. Don't confuse this with the page-level
   **"Display"** tab (`ListingDisplayControls`) some entities already have — that is listing layout,
   not rules.
6. **Regenerate the route tree** — `pnpm --filter=@eesimple/client routeTree` (never hand-edit
   `routeTree.gen.ts`).

## Reuse (do not reimplement)

`CardDisplayRuleCard`, `CardDisplayRuleForm`, `CardDisplayRuleDisplaySettings`, `CardFieldZoneBoard`,
`ConditionsField` — the whole editor stack — and the `useCardDisplayRules` / `useCreateCardDisplayRule`
hooks. `CardDisplayRuleForm` accepts an optional `seedConditions` prop for the pre-scoped create form.

## Verify

```
pnpm --filter=@eesimple/client routeTree
pnpm typecheck
pnpm test            # incl. lib/cardDisplayRulesFilter.test.ts
pnpm lint:fix        # always from repo root
pnpm fallow health   # CardDisplayRulesList stays under the cognitive-complexity cap
```

Then `pnpm dev`: the entity's **Display Rules** tab (View and Edit) lists only the non-Default rules
referencing it; expanding a card auto-saves (toast fires) and the same edit shows on the Settings
page; "Add display rule" creates a rule pre-scoped to the item that then appears in the list; a rule
referencing a *different* item does not appear.
