---
name: decompose-over-cap
description: >-
  Fix a fallow complexity violation in eeSimple Bookmarks — a component/hook over `maxCognitive: 25`
  or `maxCyclomatic: 30` — by picking the decomposition pattern that matches what is actually
  driving the score. Use when asked to "reduce the complexity of X", "fallow says X is too
  complex/over the cap", "split this huge component/hook/function", "the fallow-audit check fails on
  complexity", or before adding a `// fallow-ignore-next-line complexity`. Distills the patterns
  used to clear CommandPalette (77/73), LocationMapSection (44), FilterSidebar (34),
  TaxonomyTreeRow (34), CategoryPropertyField (32), LocationMap (32), useBookmarkImageEditForm (31),
  ReviewRow (33), and ConditionsField (27).
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
| `hook-density` (+1 per hook call) | **Controller / sub-hooks** — move cohesive `useState`/`useEffect`/query clusters into `use*` hooks in their own files | `useBookmarkFormController`; `useLocationMapLevelControls` + `useAutoRefreshLocationBoundary` (from `LocationMapSection`); `useBookmarkImageMutations` + `useScreenshotSettingsState` (from `useBookmarkImageEditForm`); `useCommandPaletteState.ts` |
| `ternary`/`logical-*` in **JSX** | **Sub-components** — lift each conditional region into a named component (own co-located file for anything non-trivial, so Phase-3 dup detection and Storybook see it) | `LocationMapFootnotes` / `LocationMapItem` / `MapOverlaySlot` (from `LocationMap`); `ReviewRowShell` (from `InboxItemsView`); `ImageActionButtons` + `BookmarkScreenshotSection` |
| `ternary`/`??` in **derivation logic** | **Pure module helper + unit test** — move the computation into `lib/` (or a co-located `.ts`) and pin it with tests in the same commit | `lib/filterSidebarVisibility.ts` (from `FilterSidebar`); `conditions/conditionsFieldTree.ts` (from `ConditionsField`) |
| `switch`/`if`-ladder mapping a value → renderer | **Exhaustive `Record` dispatch** — table keyed by the union type so a missing branch fails `tsc` | `PROPERTY_FIELD_RENDERERS` in `BookmarkCustomFields.tsx`; `OPTIONS_FIELDS` in `PropertyDetail.tsx` |
| Prop-count in a coordinator's JSX | **Spread-coordinator** — children take narrower prop interfaces; the parent spreads its props bag (`<Child {...props} />`) | `TaxonomyTreeRow` (props bag through the recursion); `BookmarkRevealedFields` |
| A giant multi-section render | **Per-group split** — one component per visual/functional group, coordinator keeps handlers + composition | `CommandPalette` → `CommandPaletteNavGroups` / `ListingPageCommandGroup` / `CommandPaletteTaxonomyModes` / `BookmarkViewPageCommandGroup` |

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
