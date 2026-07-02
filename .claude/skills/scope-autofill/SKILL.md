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
  Also covers maintaining scoping — "the X autofill tab is stale", "remove autofill scoping from X", "the rule field for X was renamed".
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

This skill focuses on the autofill/condition plumbing. For the surrounding tabbed layout
(`_view` / `edit` route shells, nav arrays, tab wrappers) see the **`tabbed-pages`** skill, §6.

## A. Action-based scoping (rule sets the entity)

1. **`AutofillRulesList`** (`packages/client/src/components/AutofillRulesList.tsx`) — add a scope
   prop next to `categoryId` / `propertyId`, fold it into `scoped`, filter `scopedRules`, and add a
   scoped empty message. (Category filter is already hidden whenever `scoped`.)
2. **Default a new rule** — the "New Autofill Rule" button opens the right panel
   (`openAutofill(NEW_SENTINEL)`). The panel's `CreateAutofillRule`
   (`packages/client/src/components/panel/AutofillRuleForms.tsx`) reads the entity slug from the URL
   via `useParams({ strict: false })` and passes a `default<Entity>Id` to `AutofillRuleForm`, which
   seeds the relevant form field. Mirror that.
3. Render `<AutofillRulesList <scope>={entity.id} query="" />` inside the entity's view + edit autofill
   tabs (the tab is wired via the workbench descriptor — see "Route files" below). `AutofillRulesList`
   requires a `query` prop; pass `query=""` inline (the text search lives only on the central page).

## B. Condition-based scoping (rule matches the entity) — the Website pattern

Condition-based scoping has two halves:

1. **Add the condition leaf type** to the shared condition tree (type + evaluator, server/client
   schema, the three summaries, builder UI). This is its own task — see the **`add-condition-type`**
   skill, which walks the Website leaf end to end. The leaf then appears in both the autofill builder
   and the Homepage filter.
2. **Scope the list to that leaf** — `AutofillRulesList`: add the scope prop, resolve the entity to
   whatever the leaf stores (websites store **domain strings**, so resolve `website.id → domain` via
   `useWebsites()`), and filter `scopedRules` by walking each rule's `conditions` for a matching leaf.
   Then default a new rule by resolving the entity from the URL slug in
   `AutofillRuleForms.CreateAutofillRule` and passing a `default…` prop that `AutofillRuleForm` seeds
   into the initial `conditions` tree (see `seedConditions`) — same as step A.2.

## Route files (both A and B)

The Autofill Rules tab is an **inline** tab driven by the entity's `EntityWorkbench` descriptor (same
source for the main pane and the right panel) — see `tabbed-pages` §6:
- **Workbench tab** — add a `{ key: "autofill", label: "Autofill Rules" }` tab to the entity's
  `components/workbench/<entity>.tsx`, both `view` and `edit` panes rendering
  `<AutofillRulesList <scope>={entity.id} query="" />`.
- **Route tabs** — `<entity>.$<slug>._view.autofill.tsx` and `<entity>.$<slug>.edit.autofill.tsx`, each
  a thin `WorkbenchRouteTab` delegation (`tabKey="autofill"`, `mode="view"|"edit"`) — mirror the
  entity's `…general` route pair.
- **Nav** — add an `{ to: ".../autofill", label: "Autofill Rules" }` entry to the `"Rules"` group in the
  `viewNav` / `editNav` arrays in the entity's `_view.tsx` / `edit.tsx` layouts, plus an `"autofill"`
  entry in the View file's `VIEW_TO_EDIT` map.
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

## Maintaining existing scoping

- **Entity field renamed/retired**: action-based scoping reads the rule's `set*`/value arrays —
  update `lib/autofillRulesFilter.ts` (which rules target this entity) and the entity tab's list
  in the same change, or the tab silently shows nothing.
- **Condition-leaf changes** (operators, shape) belong to the `add-condition-type` skill's
  maintenance section — the leaf is shared with Homepage sections, so never fork it for autofill.
- **Remove scoping from an entity**: drop the tab route + workbench entry (Edit falls back to
  General automatically) and the quick-create seeding prop; existing rules keep working — scoping
  is a view, not data.
