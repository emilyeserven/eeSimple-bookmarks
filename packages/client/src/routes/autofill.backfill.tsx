import type { AutofillBackfillEntry, GlobalAutofillBackfillGroup } from "@eesimple/types";

import { Link, createFileRoute } from "@tanstack/react-router";

import {
  useApplyAutofillBackfill,
  useGlobalAutofillBackfill,
  useRemoveAutofillExempt,
  useSetAutofillExempt,
} from "../hooks/useAutofill";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/autofill/backfill")({
  component: AutofillBackfillPage,
});

function AutofillBackfillPage() {
  const {
    data, isLoading, error,
  } = useGlobalAutofillBackfill();

  if (isLoading) {
    return (
      <section className="space-y-6">
        <PageHeader totalNeedsBackfill={undefined} />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6">
        <PageHeader totalNeedsBackfill={undefined} />
        <p className="text-sm text-destructive">Failed to load backfill data.</p>
      </section>
    );
  }

  const groups = data?.groups ?? [];

  return (
    <section className="space-y-6">
      <PageHeader totalNeedsBackfill={data?.totalNeedsBackfill} />

      {groups.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            All bookmarks are up to date — nothing needs backfilling.
          </p>
        )
        : (
          <div className="space-y-8">
            {groups.map((group, i) => (
              <div key={group.rule.id}>
                {i > 0 && <Separator className="mb-8" />}
                <RuleGroup group={group} />
              </div>
            ))}
          </div>
        )}
    </section>
  );
}

function PageHeader({
  totalNeedsBackfill,
}: {
  totalNeedsBackfill: number | undefined;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Backfill Overview</h2>
        {totalNeedsBackfill != null
          ? <Badge variant="secondary">{totalNeedsBackfill} pending</Badge>
          : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Bookmarks that match an autofill rule but haven&apos;t had its prefill values applied yet.
        You can apply rules in bulk or exempt individual bookmarks.
      </p>
    </div>
  );
}

function RuleGroup({
  group,
}: {
  group: GlobalAutofillBackfillGroup;
}) {
  const apply = useApplyAutofillBackfill();
  const needingBackfill = group.entries.filter(e => e.needsBackfill && !e.isExempt);

  function handleApplyAll() {
    apply.mutate({
      ruleId: group.rule.id,
      input: {
        bookmarkIds: needingBackfill.map(e => e.bookmark.id),
      },
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/autofill/$ruleSlug"
            params={{
              ruleSlug: group.rule.slug,
            }}
            className="
              text-base font-semibold
              hover:underline
            "
          >
            {group.rule.name}
          </Link>
          <span className="text-sm text-muted-foreground">
            {group.needsBackfillCount > 0
              ? `${group.needsBackfillCount} need backfill`
              : ""}
            {group.needsBackfillCount > 0 && group.exemptCount > 0 ? " · " : ""}
            {group.exemptCount > 0 ? `${group.exemptCount} exempt` : ""}
          </span>
        </div>
        {needingBackfill.length > 0
          ? (
            <Button
              size="sm"
              disabled={apply.isPending}
              onClick={handleApplyAll}
            >
              {apply.isPending
                ? "Applying…"
                : `Apply to ${needingBackfill.length} bookmark${needingBackfill.length === 1 ? "" : "s"}`}
            </Button>
          )
          : null}
      </div>

      <div className="space-y-1">
        {group.entries.map(entry => (
          <GlobalBackfillRow
            key={entry.bookmark.id}
            entry={entry}
            ruleId={group.rule.id}
          />
        ))}
      </div>
    </div>
  );
}

function GlobalBackfillRow({
  entry, ruleId,
}: {
  entry: AutofillBackfillEntry;
  ruleId: string;
}) {
  const setExempt = useSetAutofillExempt();
  const removeExempt = useRemoveAutofillExempt();
  const exemptPending = setExempt.isPending || removeExempt.isPending;

  return (
    <div className="flex items-start gap-3 rounded-md border px-3 py-2">
      <Checkbox
        checked={entry.needsBackfill && !entry.isExempt}
        disabled
        className="mt-0.5 shrink-0"
        aria-hidden
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
            Exempt
          </Badge>
        )
        : (
          <Badge
            variant="default"
            className="
              shrink-0 bg-amber-600
              hover:bg-amber-600
            "
          >
            Needs backfill
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
        {entry.isExempt ? "Un-exempt" : "Exempt"}
      </Button>
    </div>
  );
}
