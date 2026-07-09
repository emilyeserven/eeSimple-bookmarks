import type { SectionMatches } from "../lib/workbenchLayout";
import type { Bookmark, ConditionInput, EvaluateOptions, LayoutSection } from "@eesimple/types";

import { useCallback, useMemo } from "react";

import { evaluateConditions } from "@eesimple/types";

import { useConditionEvaluateOptions } from "./useConditionEvaluateOptions";
import { bookmarkToConditionInput } from "../lib/cardDisplayRules";

/**
 * Pure decision: does a layout section pass its `visibleIf` gate against a bookmark projection? A
 * section with no `visibleIf` (or an empty condition group) is always visible — an empty group
 * evaluates to `false`, so it must be short-circuited before the evaluator runs. Exported for direct
 * unit testing (the sibling of `resolveCardDisplay` vs. `useResolveCardDisplay`).
 */
export function sectionMatchesConditionInput(
  section: LayoutSection,
  input: ConditionInput,
  options: EvaluateOptions,
): boolean {
  const tree = section.visibleIf;
  if (!tree || tree.children.length === 0) return true;
  return evaluateConditions(tree, input, options);
}

/**
 * A stable {@link SectionMatches} predicate for one bookmark: does a layout section's `visibleIf`
 * condition tree match this bookmark's data? Models `useResolveCardDisplay` — it builds the shared
 * cascade resolvers once ({@link useConditionEvaluateOptions}) and projects the bookmark to a
 * `ConditionInput` once, then evaluates the shared `evaluateConditions` per section.
 *
 * A section with no `visibleIf` (or an empty tree) is always visible — an empty condition group
 * evaluates to `false`, so that case is short-circuited before the evaluator ever runs. While the
 * bookmark is still loading (`undefined`) every section is optimistically shown, matching
 * `fieldRendersInMode`'s "include while loading" behavior. All four hierarchical leaves honor their
 * per-item cascade toggle via the shared evaluate options.
 */
export function useBookmarkSectionVisibility(bookmark: Bookmark | undefined): SectionMatches {
  const options = useConditionEvaluateOptions();
  const input = useMemo(() => (bookmark ? bookmarkToConditionInput(bookmark) : null), [bookmark]);

  return useCallback<SectionMatches>(
    section => (input ? sectionMatchesConditionInput(section, input, options) : true),
    [input, options],
  );
}
