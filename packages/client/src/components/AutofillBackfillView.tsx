import type { AutofillBackfillEntry, AutofillRule } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import {
  useApplyAutofillBackfill,
  useAutofillBackfill,
  useRemoveAutofillExempt,
  useSetAutofillExempt,
} from "../hooks/useAutofill";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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
              <BackfillRow
                key={entry.bookmark.id}
                entry={entry}
                ruleId={rule.id}
                checked={selected.has(entry.bookmark.id)}
                onToggle={() => toggleOne(entry.bookmark.id)}
              />
            ))}
          </div>
        )}
    </div>
  );
}

function BackfillRow({
  entry, ruleId, checked, onToggle,
}: {
  entry: AutofillBackfillEntry;
  ruleId: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const setExempt = useSetAutofillExempt();
  const removeExempt = useRemoveAutofillExempt();
  const exemptPending = setExempt.isPending || removeExempt.isPending;

  return (
    <div className="flex items-start gap-3 rounded-md border px-3 py-2">
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        disabled={entry.isExempt}
        className="mt-0.5 shrink-0"
        aria-label={t("Select {{title}}", {
          title: entry.bookmark.title,
        })}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium">{entry.bookmark.title}</p>
        <p className="truncate text-xs text-muted-foreground">{entry.bookmark.url}</p>
      </div>
      {entry.isExempt
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {t("Exempt")}
          </Badge>
        )
        : entry.needsBackfill
          ? (
            <Badge
              variant="default"
              className="
                shrink-0 bg-amber-600
                hover:bg-amber-600
              "
            >
              {t("Needs backfill")}
            </Badge>
          )
          : (
            <Badge
              variant="outline"
              className="shrink-0 text-muted-foreground"
            >
              {t("Up to date")}
            </Badge>
          )}
      <Button
        variant="ghost"
        size="sm"
        disabled={exemptPending}
        onClick={() => {
          if (entry.isExempt) {
            removeExempt.mutate({
              ruleId,
              bookmarkId: entry.bookmark.id,
            });
          }
          else {
            setExempt.mutate({
              ruleId,
              bookmarkId: entry.bookmark.id,
            });
          }
        }}
      >
        {entry.isExempt ? t("Un-exempt") : t("Exempt")}
      </Button>
    </div>
  );
}
