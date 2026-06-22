---
name: display-rules-tab
description: >-
  Maintain the entity-scoped "Display Rules" tab in eeSimple Bookmarks — a tab on a taxonomy entity
  (Categories / Tags / Websites / Media Types / YouTube Channels / Custom Properties) that now
  REDIRECTS to the central Settings → Card Display Rules page pre-filtered to that item (the rules
  whose conditions reference it), where they can be edited inline. Use when asked to "add a Display
  Rules tab to X", "show which card display rules apply to X", "let me edit display rules from X's
  page", "scope card display rules to X", or to add display-rule scoping for a NEW entity. Consolidated
  into one page via the `tab-to-filtered-page` skill (mirrors the Autofill Rules → Settings → Autofill
  consolidation).
---

# The entity-scoped "Display Rules" tab (consolidated)

Card Display Rules (`CardDisplayRule`, `Settings → Card Display Rules`) change how bookmark **cards**
look (field zones, image presentation, zone layout) for the bookmarks a rule's `conditions` tree
matches. A taxonomy entity's **Display Rules** tab surfaces the non-Default rules whose conditions
reference that entity — the card-display sibling of the **Autofill Rules** tab (see `scope-autofill`).

**This is no longer an inline tab.** It was consolidated (via the `tab-to-filtered-page` skill) so the
scoped list lives in **one** place: `Settings → Card Display Rules`. Each entity keeps a "Display
Rules" tab in its nav, but the tab route is a `beforeLoad` **redirect** to
`/settings/card-display-rules?scope=<type>&scopeSlug=<slug>`. The Settings page resolves the scope to
the matching `CardDisplayRulesList` scope prop, shows a **clearable chip**, and renders the same inline
auto-saving editor. Editing a rule there updates it everywhere; the right panel no longer carries a
per-entity Display Rules tab.

Two things still make this different from the Autofill tab — keep them straight:

- **Condition-only.** Card display rules have **no "set" actions** (unlike autofill's
  `setCategoryId` / `tagIds` / value arrays). So *every* entity scope here is matched by walking the
  rule's `conditions` tree for a referencing leaf — there is no action-based scoping branch.
- **Not sortable, edited in place.** Rule priority (`sortOrder`) is **global**, reordered only on the
  unscoped Settings page. The scoped view renders matching rules with the **same** inline auto-saving
  editor (`CardDisplayRuleCard` → `CardDisplayRuleForm`); never build a tab-only editor. Rules are
  **display-only** — they never call `invalidateBookmarkCache()`.

## The leaf → entity mapping

A rule "applies to" an entity iff its `conditions` tree contains a leaf referencing it:

| Entity         | Condition leaf                                   | Scope prop     | Scope type   |
|----------------|--------------------------------------------------|----------------|--------------|
| Category       | `{ type: "category", categoryIds }`              | `categoryId`   | `category`   |
| Custom Property| `{ type: "property", propertyId, predicate }`    | `propertyId`   | `property`   |
| Website        | `{ type: "website", domains }` (by **domain**)   | `websiteId`    | `website`    |
| Tag            | `{ type: "tag", tagIds }` (exact, no cascade)    | `tagId`        | `tag`        |
| Media Type     | `{ type: "media-type", mediaTypeIds }`           | `mediaTypeId`  | `media-type` |
| YouTube Channel| `{ type: "youtube-channel", channelIds }`        | `channelId`    | `channel`    |

## How the consolidated tab is wired (already in place)

- **URL search** — `lib/cardDisplayScope.ts`: `CARD_DISPLAY_SCOPE_TYPES`, the `CardDisplayListSearch`
  (`{ scope?, scopeSlug? }` — no category/text filter, since `CardDisplayRulesList` filters by scope
  alone), and `validateCardDisplayListSearch`. Unit-tested in `lib/cardDisplayScope.test.ts`.
- **Scope resolver** — `hooks/useCardDisplayScope.ts`: the pure `resolveCardDisplayScope(scope,
  scopeSlug, data)` (+ `useCardDisplayScope` hook) maps the URL scope to the `CardDisplayRulesList`
  scope prop (the raw entity **id** — the list resolves website→domain and property→valueKind itself)
  plus a chip label, and `CARD_DISPLAY_SCOPE_LABELS`. Unit-tested in `useCardDisplayScope.test.ts`.
- **Central page** — `routes/settings.card-display-rules.tsx`: `validateSearch:
  validateCardDisplayListSearch`; with no scope it renders the full drag-sortable
  `<CardDisplayRulesSettings />`; with a scope it renders the clearable chip above
  `<CardDisplayRulesList {...listProps} />`.
- **Redirect routes** — each `<entity>.$<slug>.{_view,edit}.display-rules.tsx` is a `beforeLoad` that
  throws `redirect({ to: "/settings/card-display-rules", search: { scope, scopeSlug: params.<slug> } })`.
- **Nav kept, workbench tab removed** — the `viewNav`/`editNav` "Display Rules" entries + the
  `VIEW_TO_EDIT` `display-rules` map entries stay (the tab link redirects); the `{ key: "display-rules"
  }` object was removed from the 6 `components/workbench/<entity>.tsx` descriptors (so the panel drops
  the inline tab).
- **Filter predicate + seed** — `lib/cardDisplayRulesFilter.ts`: `ruleReferences<Entity>(rule, id)`
  (via the shared `anyLeaf` walker; websites resolve by `normalizeDomain`) and the
  `seedCardDisplayConditions(scope)` branch that pre-scopes a rule created from the filtered page.

## Adding display-rule scoping for a NEW entity

1. **Filter predicate + seed** — `lib/cardDisplayRulesFilter.ts`: add `ruleReferences<Entity>(rule,
   id)` and a `seedCardDisplayConditions` branch (property leaves seed a `presence: has` predicate
   keyed by `propertyValueKind`, see `lib/propertyConditionKind.ts`). Cover it in
   `lib/cardDisplayRulesFilter.test.ts`.
2. **List scope prop** — `components/CardDisplayRulesList.tsx`: add the scope prop, filter non-Default
   rules through the new predicate, a scoped empty message, and the new id in its inline
   `seedCardDisplayConditions` scope. Keep it a flat wiring component under fallow's complexity cap.
3. **Scope plumbing** — add the entity to `CARD_DISPLAY_SCOPE_TYPES` (`lib/cardDisplayScope.ts`), a
   branch in `resolveCardDisplayScope` + a `CARD_DISPLAY_SCOPE_LABELS` entry
   (`hooks/useCardDisplayScope.ts`), with matching test cases.
4. **Redirect routes + nav** — add `<entity>.$<slug>._view.display-rules.tsx` and
   `.edit.display-rules.tsx` as `beforeLoad` redirects (copy an existing pair), and add a
   `{ to: ".../display-rules", label: "Display Rules" }` entry to **both** the `viewNav`/`editNav`
   arrays and a `"display-rules": ".../edit/display-rules"` entry to the View file's `VIEW_TO_EDIT`
   map. Do **not** add a `display-rules` tab to the entity's workbench descriptor.
5. **Regenerate the route tree** — `pnpm --filter=@eesimple/client routeTree` (never hand-edit
   `routeTree.gen.ts`).

## Reuse (do not reimplement)

`CardDisplayRulesList`, `CardDisplayRulesSettings`, `CardDisplayRuleCard`, `CardDisplayRuleForm`,
`CardDisplayRuleDisplaySettings`, `CardFieldZoneBoard`, `ConditionsField` — the whole editor stack —
and the `useCardDisplayRules` / `useCreateCardDisplayRule` / `useReorderCardDisplayRules` hooks.
`CardDisplayRuleForm` accepts an optional `seedConditions` prop for the pre-scoped create form.

## Verify

```
pnpm --filter=@eesimple/client routeTree
pnpm typecheck
pnpm test            # incl. lib/cardDisplayScope.test.ts, hooks/useCardDisplayScope.test.ts, lib/cardDisplayRulesFilter.test.ts
pnpm lint:fix        # always from repo root
pnpm fallow health   # CardDisplayRulesList stays under the cognitive-complexity cap
```

Then `pnpm dev`: visiting an entity's **Display Rules** tab (View or Edit) redirects to
`/settings/card-display-rules?scope=…&scopeSlug=…`; the page shows a "Filtered to <type>: <name>" chip
and lists only the non-Default rules referencing that item; expanding a card auto-saves (toast fires)
and the same edit shows on the unscoped Settings page; "Add display rule" creates a rule pre-scoped to
the item; clearing the chip returns to the full drag-sortable list; a rule referencing a *different*
item does not appear.
