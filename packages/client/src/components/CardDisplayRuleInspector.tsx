import type { BookmarkRuleInspection } from "../lib/cardDisplayRules";
import type { Bookmark } from "@eesimple/types";

import { useMemo, useState } from "react";

import { CardRuleInspectorMatches } from "./CardRuleInspectorMatches";
import { Combobox } from "./Combobox";
import { useCardRuleInspectorData } from "../hooks/useCardRuleInspectorData";
import { inspectBookmarkRules } from "../lib/cardDisplayRules";

import { Label } from "@/components/ui/label";

/**
 * Settings inspector: pick a bookmark and see which card display rules apply to it, what each
 * matching rule sets, and which attributes were overridden by a higher-priority rule. A pure view
 * over the same `resolveCardDisplay` provenance the listing cards use, so the two always agree.
 */
export function CardDisplayRuleInspector() {
  const {
    bookmarks,
    options,
    sortedRules,
    tagDescendants,
    ruleNameById,
    labels,
  } = useCardRuleInspectorData();

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const selectedBookmark: Bookmark | undefined = selectedId
    ? bookmarks.find(bookmark => bookmark.id === selectedId)
    : undefined;

  const inspection: BookmarkRuleInspection | null = useMemo(
    () => (selectedBookmark
      ? inspectBookmarkRules(selectedBookmark, sortedRules, tagDescendants)
      : null),
    [selectedBookmark, sortedRules, tagDescendants],
  );

  const matchedRules = inspection?.rules.filter(ri => ri.matched) ?? [];
  const unmatchedRules = inspection?.rules.filter(ri => !ri.matched) ?? [];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="card-rule-inspector">Inspect a bookmark</Label>
        <p className="text-sm text-muted-foreground">
          Pick a bookmark to see which rules apply to it — and what each rule sets versus what a
          higher-priority rule overrode.
        </p>
        <Combobox
          id="card-rule-inspector"
          options={options}
          value={selectedId}
          onValueChange={setSelectedId}
          placeholder="Search for a bookmark…"
          searchPlaceholder="Search bookmarks…"
          emptyText="No bookmarks found."
        />
      </div>

      {inspection
        ? (
          <CardRuleInspectorMatches
            matchedRules={matchedRules}
            unmatchedRules={unmatchedRules}
            ruleNameById={ruleNameById}
            labels={labels}
          />
        )
        : selectedId
          ? <p className="text-sm text-muted-foreground">Bookmark not found.</p>
          : null}
    </div>
  );
}
