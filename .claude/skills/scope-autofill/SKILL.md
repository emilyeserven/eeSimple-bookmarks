---
name: scope-autofill
description: >-
  Scope autofill rules to an entity in eeSimple Bookmarks — add an entity-scoped "Autofill Rules"
  tab (like Categories / Custom Properties / Websites) and, when the entity is a *matching
  criterion* rather than an *action*, add a new condition leaf type to the shared condition tree.
  Use when asked to "add an autofill tab to X", "let rules target/scope to X", "make autofill work
  for X", "add a new filter/condition type", or "split a match condition out". Mirrors how
  categories (`setCategoryId`), custom properties (value arrays), and websites (Website condition)
  each scope autofill rules.
---

# Scope autofill rules to an entity

Autofill rules (`AutofillRule`) have a "when" (a recursive `ConditionTree`) and a "then" (set a
category / tags / custom-property values). An entity's **Autofill Rules** tab shows a filtered slice
of the global rules list. There are **two** ways a rule relates to an entity — pick the one that
matches the entity's role:

- **Action-based** — the rule's *then* sets the entity. Used by **Categories** (`rule.setCategoryId`)
  and **Custom Properties** (a value in `rule.numberValues`/`booleanValues`/`dateTimeValues`). Scope
  the tab by what the rule sets.
- **Condition-based** — the rule's *when* matches the entity. Used by **Websites** (a `website`
  condition leaf). A website isn't something a rule *does* to a bookmark, it's a matching criterion,
  so it lives in the condition tree, not as a scalar "set" field.

The condition tree is shared by autofill rules **and** the Homepage filter (same `ConditionsField` +
`evaluateConditions`), so a new condition leaf appears in both surfaces automatically.

This skill focuses on the autofill/condition plumbing. For the surrounding vertical-tab layout
(`_view` / `edit` route shells, nav arrays, tab wrappers) see the **`tabbed-pages`** skill, §6.

## A. Action-based scoping (rule sets the entity)

1. **`AutofillRulesList`** (`packages/client/src/components/AutofillRulesList.tsx`) — add a scope
   prop next to `categoryId` / `propertyId`, fold it into `scoped`, filter `scopedRules`, and add a
   scoped empty message. (Category filter is already hidden whenever `scoped`.)
2. **Default a new rule** — the "New Autofill Rule" button opens the right panel
   (`openAutofill(NEW_SENTINEL)`). The panel's `CreateAutofillRule`
   (`packages/client/src/components/panel/AutofillRulePanel.tsx`) reads the entity slug from the URL
   via `useParams({ strict: false })` and passes a `default<Entity>Id` to `AutofillRuleForm`, which
   seeds the relevant form field. Mirror that.
3. Render `<AutofillRulesList <scope>={entity.id} />` inside the entity's view + edit autofill tabs.

## B. Condition-based scoping (rule matches the entity) — the Website pattern

Add a new condition leaf type, then scope by it. Touch points (Website is the reference):

1. **Shared type + evaluator** — `packages/types/src/conditions.ts`:
   - Add the leaf interface (e.g. `WebsiteCondition { type: "website"; domains: string[] }`) and add
     it to the `ConditionNode` union.
   - Add a `case` to `evaluateConditions`. **Keep the evaluator pure** — it must run unchanged in the
     browser and in `homepageSections.ts`. Website matches on `hostOf(input.url)` so it needs no
     resolver; if your leaf needs lookups, follow the `tagDescendants` resolver precedent in
     `EvaluateOptions` rather than reaching for a DB.
   - Adding to the union is enforced by exhaustive `switch`es — `lib/conditionsSummary.ts` will fail
     to compile until you add the case, which is your checklist.
2. **Server schema** — `packages/middleware/src/routes/conditionSchema.ts`: add a node schema and
   include it in `conditionNodeSchema.oneOf`.
3. **Client validator** — `packages/client/src/lib/conditionsSchema.ts`: validate the leaf
   (e.g. require ≥1 selection) in the `walk`.
4. **Summaries (three of them)** — `lib/conditionsSummary.ts` (string used by the list),
   `components/conditions/summarizeConditions.ts` (counts + breakdown), and the local
   `summarizeConditions` in `AutofillRuleForm.tsx`.
5. **Builder UI** — `components/conditions/ConditionsField.tsx`: read the leaf, add a `Section`, and
   extend `commit()` (drop the leaf when empty, like the category/tag leaves). Add an editor
   component under `components/conditions/`. For a multi-select reuse `MultiCombobox`
   (`CategoryConditionEditor` is the template); for websites reuse the existing website `Combobox` +
   "Add new website" `Dialog`.
6. **Scope the list** — `AutofillRulesList`: add the scope prop, resolve the entity to whatever the
   leaf stores (websites store **domain strings**, so resolve `website.id → domain` via
   `useWebsites()`), and filter `scopedRules` by walking each rule's `conditions` for a matching
   leaf.
7. **Default a new rule** — in `AutofillRulePanel.CreateAutofillRule` resolve the entity from the URL
   slug and pass a `default…` prop; `AutofillRuleForm` seeds the initial `conditions` tree with the
   leaf (see `seedConditions`).
8. **Boot backfill for legacy data** — if the new leaf supersedes an older encoding (Website replaced
   the legacy `match`/`domain` operator), add an idempotent `ensure*` step to
   `services/autofill.ts` and wire it into `src/index.ts` next to the other autofill `ensure*` steps
   (after `app.listen()`, per CLAUDE.md boot ordering). Keep legacy types/evaluator branches intact
   so old stored trees still evaluate.

## Route files (both A and B)

Add the two tab routes (mirror `categories.$categorySlug._view.autofill.tsx` /
`…edit.autofill.tsx`) and the nav entries — see `tabbed-pages` §6:
- `<entity>.$<slug>._view.autofill.tsx` and `<entity>.$<slug>.edit.autofill.tsx`, each a thin
  `<Entity>TabWrapper` → `<AutofillRulesList <scope>={entity.id} />`.
- Add an "Autofill Rules" entry to the `viewNav` / `editNav` arrays in the entity's `_view.tsx` /
  `edit.tsx` layouts.
- Regenerate the route tree: `pnpm --filter=@eesimple/client routeTree` (never hand-edit
  `routeTree.gen.ts`).

## Verify

```
pnpm --filter=@eesimple/client routeTree
pnpm build           # types → middleware → client (shared-type change must propagate)
pnpm typecheck
pnpm test
pnpm lint:fix        # always from repo root
```

Then `pnpm dev`: the entity's Autofill tab lists only its scoped rules (correct empty message);
"New Autofill Rule" pre-fills the entity; for a new condition type, both the rule builder and the
Homepage filter show the new section and round-trip a saved value.
