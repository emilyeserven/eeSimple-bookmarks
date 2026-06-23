import type { AutofillBackfillEntry, AutofillRule } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useApplyAutofillBackfill, useAutofillBackfill } from "../hooks/useAutofill";

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
    data, isLoading, error,
  } = useAutofillBackfill(rule.id);
  const apply = useApplyAutofillBackfill();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    setSelected(new Set(data.entries.filter(e => e.needsBackfill).map(e => e.bookmark.id)));
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
        This rule has no prefill values to apply. Add a category, tags, media type, or custom
        property values in the &quot;What Gets Prefilled&quot; tab first.
      </p>
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load matching bookmarks.</p>;

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
          {entries.length} matching · {needCount} need backfill · {selected.size} selected
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set(entries.filter(e => e.needsBackfill).map(e => e.bookmark.id)))}
          >
            Select needing backfill
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set(entries.map(e => e.bookmark.id)))}
          >
            Select all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Deselect all
          </Button>
          <Button
            size="sm"
            disabled={selected.size === 0 || apply.isPending}
            onClick={handleApply}
          >
            {apply.isPending ? "Applying…" : `Apply to ${selected.size} selected`}
          </Button>
        </div>
      </div>

      {entries.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            No bookmarks currently match this rule&apos;s conditions.
          </p>
        )
        : (
          <div className="space-y-1">
            {entries.map(entry => (
              <BackfillRow
                key={entry.bookmark.id}
                entry={entry}
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
  entry, checked, onToggle,
}: {
  entry: AutofillBackfillEntry;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-md border px-3 py-2"
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5 shrink-0"
        aria-label={`Select ${entry.bookmark.title}`}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium">{entry.bookmark.title}</p>
        <p className="truncate text-xs text-muted-foreground">{entry.bookmark.url}</p>
      </div>
      <Badge
        variant={entry.needsBackfill ? "default" : "outline"}
        className={
          entry.needsBackfill
            ? `
              shrink-0 bg-amber-600
              hover:bg-amber-600
            `
            : "shrink-0 text-muted-foreground"
        }
      >
        {entry.needsBackfill ? "Needs backfill" : "Up to date"}
      </Badge>
    </div>
  );
}
