import type { SectionMatches } from "../lib/workbenchLayout";
import type { Bookmark, ConditionInput, LayoutSection, TagDescendants } from "@eesimple/types";

import { useCallback, useMemo } from "react";

import { buildTagDescendants, evaluateConditions } from "@eesimple/types";

import { useTags } from "./useTags";
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
  tagDescendants: TagDescendants,
): boolean {
  const tree = section.visibleIf;
  if (!tree || tree.children.length === 0) return true;
  return evaluateConditions(tree, input, {
    tagDescendants,
  });
}

/**
 * A stable {@link SectionMatches} predicate for one bookmark: does a layout section's `visibleIf`
 * condition tree match this bookmark's data? Models `useResolveCardDisplay` — it loads the tags once
 * (already cached by React Query), builds the tag-cascade resolver a single time, and projects the
 * bookmark to a `ConditionInput` once, then evaluates the shared `evaluateConditions` per section.
 *
 * A section with no `visibleIf` (or an empty tree) is always visible — an empty condition group
 * evaluates to `false`, so that case is short-circuited before the evaluator ever runs. While the
 * bookmark is still loading (`undefined`) every section is optimistically shown, matching
 * `fieldRendersInMode`'s "include while loading" behavior. Location leaves match by exact id (no
 * cascade), matching `useResolveCardDisplay`'s current behavior.
 */
export function useBookmarkSectionVisibility(bookmark: Bookmark | undefined): SectionMatches {
  const {
    data: tags = [],
  } = useTags();

  const tagDescendants = useMemo(
    () => buildTagDescendants(tags.map(tag => ({
      id: tag.id,
      parentId: tag.parentId,
    }))),
    [tags],
  );
  const input = useMemo(() => (bookmark ? bookmarkToConditionInput(bookmark) : null), [bookmark]);

  return useCallback<SectionMatches>(
    section => (input ? sectionMatchesConditionInput(section, input, tagDescendants) : true),
    [input, tagDescendants],
  );
}
