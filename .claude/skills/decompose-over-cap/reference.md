# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Large-form / over-cap decomposition

When a component or hook trips fallow's cognitive-complexity cap (`maxCognitive: 25`), the cause is
usually **hook-density, not branching**. fallow scores **each function independently** — nested
function bodies are **not** rolled into the parent (unlike SonarJS) — so **extracting handler
functions does not lower a component's score**. What it counts is **+1 per hook call** (`useState` /
`useRef` / `useEffect` / every custom hook) plus +1 per `??`, `&&`, and ternary (`?.` only affects
*cyclomatic*). A form that calls ~25 hooks is over the cap before a single `if`. Use
`pnpm exec fallow health --complexity-breakdown` to see the per-decision contributions.

The remedy is to **spread the hooks**, not the handlers. The reference is the **bookmark form**
(`BookmarkForm.tsx`, ~250 lines of thin JSX):

- a **controller hook** (`useBookmarkFormController.ts`) owns the `useAppForm` instance, the state,
  and every create/edit/scan/reset handler — the component just wires its return into JSX;
- **cohesive state sub-hooks** partition the `useState`s so no one function is hook-dense
  (`useBookmarkFormUiState`, `useSourceDefaultFlags` in `useBookmarkFormState.ts`);
- **module-level pure helpers** hold the heaviest self-contained logic and the `??` chains, and are
  unit-tested directly (`bookmarkSubmit.ts`'s `applyImageIntent` / `promoteSourceDefaults`,
  `buildBookmarkDefaultValues` in `bookmarkFormSchema.ts`).

This is the **state-orchestration** sibling to **PropertyForm**'s section-component split (see
**Content hierarchies**): PropertyForm divides the *rendered UI* into section components typed via the
shared form-API sample type; the bookmark form additionally moves the *state + handlers* out of the
component. Reach for a controller hook when the cap pressure is hook-density rather than inline JSX
branching. Don't reintroduce a `// fallow-ignore-next-line complexity` to dodge this. The
**CMD+K palette** is the same pattern at coordinator scale: its state hooks live in
`useCommandPaletteState.ts` and each command group is its own component
(`CommandPaletteNavGroups` / `ListingPageCommandGroup` / `CommandPaletteTaxonomyModes` / …), leaving
`CommandPalette.tsx` as handlers + composition — split a new over-cap coordinator along the same
group seams rather than growing it inline. This nests when the extracted view is itself over cap:
`CommandPaletteTaxonomyModes`' flat chain of `mode === "…" && bookmarkId && (<SubPalette .../>)`
guards became one small named component per mode (each doing its own guard, scored independently);
`CommandPalette`'s "default view" fragment became `CommandPaletteDefaultView`, whose own guard-chain
group render was further split into one component per conditional group
(`BookmarkQuickEditGroups` / `QuickAddGroup` / `SyncFromSourceGroup` / …). See the
**`decompose-over-cap`** skill for the full pattern table (hook-density → sub-hook, `??`/ternary →
pure helper or reuse an existing one, switch-shaped dispatch → per-branch components, repeated
non-JSX blocks like `useBookmarkGeneralForm`'s 7 near-identical `save<Field>` mutators → one
parametrized helper).
