import type { AutofillRule } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { AutofillBackfillRow } from "./AutofillBackfillRow";
import { useApplyAutofillBackfill, useAutofillBackfill } from "../hooks/useAutofill";

import { Button } from "@/components/ui/button";

interface Props {
  rule: AutofillRule;
}

export function AutofillBackfillView({
  rule,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data, isLoading, error,
  } = useAutofillBackfill(rule.id);
  const apply = useApplyAutofillBackfill();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    setSelected(new Set(data.entries.filter(e => e.needsBackfill && !e.isExempt).map(e => e.bookmark.id)));
  }, [data]);

  const hasPrefill
    = rule.setCategoryId != null
      || rule.setMediaTypeId != null
      || rule.tagIds.length > 0
      || rule.numberValues.length > 0
      || rule.booleanValues.length > 0
      || rule.dateTimeValues.length > 0;

  if (!hasPrefill) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("This rule has no prefill values to apply. Add a category, tags, media type, or custom property values in the \"What Gets Prefilled\" tab first.")}
      </p>
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("Loading…")}</p>;
  if (error) return <p className="text-sm text-destructive">{t("Failed to load matching bookmarks.")}</p>;

  const entries = data?.entries ?? [];
  const needCount = entries.filter(e => e.needsBackfill).length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApply() {
    apply.mutate({
      ruleId: rule.id,
      input: {
        bookmarkIds: [...selected],
      },
    }, {
      onSuccess: () => setSelected(new Set()),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {t("{{total}} matching · {{needCount}} need backfill · {{selectedCount}} selected", {
            total: entries.length,
            needCount,
            selectedCount: selected.size,
          })}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set(entries.filter(e => e.needsBackfill && !e.isExempt).map(e => e.bookmark.id)))}
          >
            {t("Select needing backfill")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set(entries.map(e => e.bookmark.id)))}
          >
            {t("Select all")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            {t("Deselect all")}
          </Button>
          <Button
            size="sm"
            disabled={selected.size === 0 || apply.isPending}
            onClick={handleApply}
          >
            {apply.isPending
              ? t("Applying…")
              : t("Apply to {{count}} selected", {
                count: selected.size,
              })}
          </Button>
        </div>
      </div>

      {entries.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            {t("No bookmarks currently match this rule's conditions.")}
          </p>
        )
        : (
          <div className="space-y-1">
            {entries.map(entry => (
              <AutofillBackfillRow
                key={entry.bookmark.id}
                entry={entry}
                ruleId={rule.id}
                checkbox={{
                  mode: "interactive",
                  checked: selected.has(entry.bookmark.id),
                  onToggle: () => toggleOne(entry.bookmark.id),
                }}
              />
            ))}
          </div>
        )}
    </div>
  );
}
