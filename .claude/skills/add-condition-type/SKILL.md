---
name: add-condition-type
description: >-
  Add a new condition leaf type to the shared condition tree in eeSimple Bookmarks — a matching
  criterion that appears in BOTH the autofill rule builder and the Homepage section filter (they
  share `ConditionsField` + `evaluateConditions`). Use when asked to "add a new filter/condition
  type", "let rules/sections match on X", "add a Tag/Category/Website-style condition", or "split a
  match condition out into its own leaf". Mirrors the Website / Category / Tag / Property leaves.
  Also covers maintaining an existing leaf — "rename/extend/remove a condition type", "add an operator to X conditions".
---

# Add a condition leaf type

The condition tree (`ConditionTree` / `ConditionNode` in `packages/types/src/conditions.ts`) is the
shared "when" used by **autofill rules** *and* the **Homepage section filter** — both render the same
`ConditionsField` and evaluate with the same pure `evaluateConditions`. Add a leaf once and it shows
up in both surfaces automatically.

Current leaves (copy whichever is closest): **Match** (title/name text), **Category**, **Tag**,
**Property** (custom-property value), **Website** (domain set). **Website** is the cleanest recent
template for a multi-select-of-entity leaf — follow it.

> Adding a scoped **Autofill Rules tab** to an entity (so its page lists the rules that reference it)
> is the sibling task — see the **`scope-autofill`** skill. This skill is just the condition leaf.

## Touch points (Website is the reference)

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
   component under `components/conditions/` (e.g. `WebsiteConditionEditor.tsx`). For a **flat
   entity multi-select** (e.g. Media Types, Relationship Types) reuse
   `EntityMultiSelectCondition` from `components/conditions/EntityMultiSelectCondition.tsx` — it
   wraps `MultiCombobox` with the standard aria/placeholder props so editors don't duplicate the
   markup. For websites reuse the website `Combobox` + "Add new website" `Dialog`.
6. **Default-seed a new rule (optional)** — if an entity page creates rules pre-scoped to itself, the
   panel's `CreateAutofillRule` (`components/panel/AutofillRulePanel.tsx`) resolves the entity from
   the URL slug and passes a `default…` prop; `AutofillRuleForm` seeds the initial `conditions` tree
   with the leaf (see `seedConditions`).
7. **Boot backfill for legacy data** — if the new leaf supersedes an older encoding (Website replaced
   the legacy `match`/`domain` operator), add an idempotent `ensure*` step to
   `services/autofill.ts` and wire it into `src/index.ts` next to the other autofill `ensure*` steps
   (after `app.listen()`, per CLAUDE.md boot ordering). Keep legacy types/evaluator branches intact
   so old stored trees still evaluate.

## Verify

```
pnpm build           # types → middleware → client (shared-type change must propagate)
pnpm typecheck       # the exhaustive switches catch a missed surface
pnpm test
pnpm lint:fix        # always from repo root
```

Then `pnpm dev`: both the **autofill rule builder** and the **Homepage section filter** show the new
condition section and round-trip a saved value; a rule/section using it matches the expected
bookmarks.

## Maintaining an existing leaf

The add-checklist above doubles as the sync-point list — walk the same touch points for any change:

- **Add an operator / field to a leaf**: the shared type + `evaluateConditions` arm
  (`packages/types/src/conditions.ts`), its editor in `conditions/conditionEditors.tsx`, the
  summary in `lib/conditionsSummary.ts`, and the middleware `routes/conditionSchema.ts` `oneOf`.
  Extend `conditions.test.ts` for the new semantics in the same change.
- **The root-builder split**: `conditions/conditionsFieldTree.ts` (`splitRootConditions` /
  `buildRootChildren`) hand-lists every root leaf — a new or removed leaf type must be
  added/removed there too, and `conditionsFieldTree.test.ts` extended, or the builder silently
  drops it from saved trees.
- **Remove a leaf type**: reverse the checklist, but stored `conditions` jsonb may still carry old
  leaves — keep `evaluateConditions` tolerant of the retired `type` (return non-match) or add a
  `migrate.ts` step that strips it; never let an unknown leaf throw.
