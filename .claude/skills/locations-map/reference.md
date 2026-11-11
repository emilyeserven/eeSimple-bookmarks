# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Locations & maps

The Locations map / "Levels" overlay / place-types subsystem is the codebase's most-churned area, so
its state model is **written down**: the top-of-file doc block in
`packages/client/src/lib/locationLevels.ts` is the spec (level groups, the `main`/`location`/`bookmark`
scope + anchors, the `visibleIds = (override ?? default) ∩ populated` layering, the three persistence
tiers, and the two distinct tree-prune operations), and the **`locations-map`** skill maps the whole
subsystem (render pipeline, place-type level groups, geocoding fallback chain) plus the change recipes.
**Read the doc block before touching any `Location*Map*` / `locationLevels` / geocoding file.** Key
seams: the two overlays share `components/locationLevelsShared.tsx` (a row/footer change lands in both
at once); "wrong levels/checkbox" bugs live in the pure helpers (`computeVisibleLevelGroupIds` /
`computePopulatedLevelGroupIds` / `resolveVisibleLevelGroupIds`, tested in `locationLevels.test.ts`),
never the components; and a per-map visibility checkbox is a throwaway local override while the pin/area
toggle beside it is a global server write via `useLocationLevels` — don't conflate the tiers.
