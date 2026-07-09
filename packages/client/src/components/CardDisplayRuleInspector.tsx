import type { BookmarkRuleInspection } from "../lib/cardDisplayRules";
import type { Bookmark } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

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
    evaluateOptions,
    ruleNameById,
    labels,
  } = useCardRuleInspectorData();

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const {
    t,
  } = useTranslation();

  const selectedBookmark: Bookmark | undefined = selectedId
    ? bookmarks.find(bookmark => bookmark.id === selectedId)
    : undefined;

  const inspection: BookmarkRuleInspection | null = useMemo(
    () => (selectedBookmark
      ? inspectBookmarkRules(selectedBookmark, sortedRules, evaluateOptions)
      : null),
    [selectedBookmark, sortedRules, evaluateOptions],
  );

  const matchedRules = inspection?.rules.filter(ri => ri.matched) ?? [];
  const unmatchedRules = inspection?.rules.filter(ri => !ri.matched) ?? [];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="card-rule-inspector">{t("Inspect a bookmark")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("Pick a bookmark to see which rules apply to it — and what each rule sets versus what a higher-priority rule overrode.")}
        </p>
        <Combobox
          id="card-rule-inspector"
          options={options}
          value={selectedId}
          onValueChange={setSelectedId}
          placeholder={t("Search for a bookmark…")}
          searchPlaceholder={t("Search bookmarks…")}
          emptyText={t("No bookmarks found.")}
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
          ? <p className="text-sm text-muted-foreground">{t("Bookmark not found.")}</p>
          : null}
    </div>
  );
}
