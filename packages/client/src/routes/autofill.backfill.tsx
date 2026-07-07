import type { GlobalAutofillBackfillGroup } from "@eesimple/types";

import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AutofillBackfillRow } from "../components/AutofillBackfillRow";
import { useApplyAutofillBackfill, useGlobalAutofillBackfill } from "../hooks/useAutofill";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/autofill/backfill")({
  component: AutofillBackfillPage,
});

function AutofillBackfillPage() {
  const {
    t,
  } = useTranslation();
  const {
    data, isLoading, error,
  } = useGlobalAutofillBackfill();

  if (isLoading) {
    return (
      <section className="space-y-6">
        <PageHeader totalNeedsBackfill={undefined} />
        <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6">
        <PageHeader totalNeedsBackfill={undefined} />
        <p className="text-sm text-destructive">{t("Failed to load backfill data.")}</p>
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
            {t("All bookmarks are up to date — nothing needs backfilling.")}
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
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{t("Backfill Overview")}</h2>
        {totalNeedsBackfill != null
          ? (
            <Badge variant="secondary">{t("{{count}} pending", {
              count: totalNeedsBackfill,
            })}
            </Badge>
          )
          : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {t("Bookmarks that match an autofill rule but haven't had its prefill values applied yet. You can apply rules in bulk or exempt individual bookmarks.")}
      </p>
    </div>
  );
}

function RuleGroup({
  group,
}: {
  group: GlobalAutofillBackfillGroup;
}) {
  const {
    t,
  } = useTranslation();
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
              ? t("{{count}} need backfill", {
                count: group.needsBackfillCount,
              })
              : ""}
            {group.needsBackfillCount > 0 && group.exemptCount > 0 ? " · " : ""}
            {group.exemptCount > 0
              ? t("{{count}} exempt", {
                count: group.exemptCount,
              })
              : ""}
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
                ? t("Applying…")
                : needingBackfill.length === 1
                  ? t("Apply to 1 bookmark")
                  : t("Apply to {{count}} bookmarks", {
                    count: needingBackfill.length,
                  })}
            </Button>
          )
          : null}
      </div>

      <div className="space-y-1">
        {group.entries.map(entry => (
          <AutofillBackfillRow
            key={entry.bookmark.id}
            entry={entry}
            ruleId={group.rule.id}
            checkbox={{
              mode: "readonly",
            }}
          />
        ))}
      </div>
    </div>
  );
}
