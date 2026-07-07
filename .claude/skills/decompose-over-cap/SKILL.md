---
name: decompose-over-cap
description: >-
  Fix a fallow complexity violation in eeSimple Bookmarks — a component/hook over `maxCognitive: 25`
  or `maxCyclomatic: 30` — by picking the decomposition pattern that matches what is actually
  driving the score. Use when asked to "reduce the complexity of X", "fallow says X is too
  complex/over the cap", "split this huge component/hook/function", "the fallow-audit check fails on
  complexity", or before adding a `// fallow-ignore-next-line complexity`. Distills the patterns
  used to clear CommandPalette (77/73, then 21/26 on its second pass), LocationMapSection (44),
  FilterSidebar (34), TaxonomyTreeRow (34), CategoryPropertyField (32), LocationMap (32),
  useBookmarkImageEditForm (31), ReviewRow (33), ConditionsField (27),
  CommandPaletteTaxonomyModes (31/14), TaxonomyTreeRowInner (14/26), and useBookmarkGeneralForm
  (14/28).
---

# Decomposing an over-cap component or hook

**Diagnose before cutting.** fallow scores **each function independently** — nested function bodies
are *not* rolled into the parent, so extracting handlers into lambdas inside the same component does
nothing. Get the real drivers first:

```bash
pnpm exec fallow health --complexity --complexity-breakdown --format json --quiet
```

The `contributions[]` kinds map to a pattern:

| Dominant kind | Pattern | Merged reference |
|---|---|---|
| `hook-density` (+1 per hook call) | **Controller / sub-hooks** — move cohesive `useState`/`useEffect`/query clusters into `use*` hooks in their own files | `useBookmarkFormController`; `useLocationMapLevelControls` + `useAutoRefreshLocationBoundary` (from `LocationMapSection`); `useBookmarkImageMutations` + `useScreenshotSettingsState` (from `useBookmarkImageEditForm`); `useCommandPaletteState.ts`; `useBookmarkGeneralUiState` (from `useBookmarkGeneralForm`, 9 `useState`s + 2 `useRef`s → one hook call) |
| `ternary`/`logical-*` in **JSX** | **Sub-components** — lift each conditional region into a named component (own co-located file for anything non-trivial, so Phase-3 dup detection and Storybook see it) | `LocationMapFootnotes` / `LocationMapItem` / `MapOverlaySlot` (from `LocationMap`); `ReviewRowShell` (from `InboxItemsView`); `ImageActionButtons` + `BookmarkScreenshotSection`; `TaxonomyTreeRowExpander` / `TaxonomyTreeRowFilterButton` / `TaxonomyTreeRowExpandAllButton` (from `TaxonomyTreeRowInner`) |
| `ternary`/`??` in **derivation logic** | **Pure module helper + unit test** — move the computation into `lib/` (or a co-located `.ts`) and pin it with tests in the same commit; check for an existing helper first — `useBookmarkGeneralForm`'s inline `defaultValues` object turned out to exactly match the already-tested `buildBookmarkDefaultValues` in `bookmarkFormSchema.ts`, so reusing it (rather than writing a near-duplicate) removed the whole `??`/`?.` chain for free | `lib/filterSidebarVisibility.ts` (from `FilterSidebar`); `conditions/conditionsFieldTree.ts` (from `ConditionsField`); `buildBookmarkDefaultValues` reuse (from `useBookmarkGeneralForm`) |
| `switch`/`if`-ladder mapping a value → renderer | **Exhaustive `Record` dispatch**, or — when each branch's JSX/props differ enough that a table adds indirection — **one small named component per branch**, each doing its own guard so fallow scores it independently | `PROPERTY_FIELD_RENDERERS` in `BookmarkCustomFields.tsx`; `OPTIONS_FIELDS` in `PropertyDetail.tsx`; `CommandPaletteTaxonomyModes`'s 10 per-mode components (`CategoryMode` / `TagsMode` / … each doing its own `taxonomy.taxonomyMode === "…" && …` guard) |
| Prop-count in a coordinator's JSX | **Spread-coordinator** — children take narrower prop interfaces; the parent spreads its props bag (`<Child {...props} />`) | `TaxonomyTreeRow` (props bag through the recursion); `BookmarkRevealedFields` |
| A giant multi-section render | **Per-group split** — one component per visual/functional group, coordinator keeps handlers + composition. Can nest: if the extracted view is itself over cap, split its sections into named components too (each with its own guard) rather than one big conditional block | `CommandPalette` → `CommandPaletteNavGroups` / `ListingPageCommandGroup` / `CommandPaletteTaxonomyModes` / `BookmarkViewPageCommandGroup` / `CommandPaletteDefaultView` (the "default view" fragment, itself further split into `BookmarkQuickEditGroups` / `QuickAddGroup` / `SyncFromSourceGroup` / `BookmarkViewGroup` / `SettingsFavoriteGroup` / `MatchedEntityGroup`) |
| Repeated near-identical **non-JSX** blocks (e.g. several `mutate` + toast-on-success/error functions) | **Parametrized helper** — collapse into one function taking the varying bits as params; keep the original names as thin wrappers so the public API is unchanged | `saveBookmarkArrayField` (from `useBookmarkGeneralForm`'s 7 `save<Field>` functions) |

Repeated near-identical JSX blocks (summaries, footnotes, pagination rows) collapse into one small
parametrized component first — `CountSection` (ConditionsField), `CountNote` (LocationMapFootnotes),
`PinPaginationItem` (SidebarPrimaryNav) — that alone often clears the cap.

## Rules

- **Pair every extracted conditional/derivation with a test in the same commit** if it wasn't
  already covered (see `filterSidebarVisibility.test.ts`, `conditionsFieldTree.test.ts`). Hard to
  test in isolation means the seam is wrong — fix the seam.
- **Behavior-preserving only**: JSX moves verbatim; wording, handlers, and keys stay identical. Keep
  a detailed React `key` (e.g. the `GeoJSON` color+boundary key in `LocationMapItem`) *inside* the
  extracted child so remount semantics don't change.
- Verify with the package's tests plus `pnpm --filter=@eesimple/client build-storybook` when the
  component has stories, then confirm the finding is gone:
  `pnpm exec fallow health --complexity --format json --quiet`.
- `// fallow-ignore-next-line complexity` is a last resort for genuinely irreducible code (an
  exhaustive type-narrowing switch) — never a shortcut. CLAUDE.md → **Large-form / over-cap
  decomposition** has the long-form rationale.
