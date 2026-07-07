import type { AutofillBackfillEntry } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useRemoveAutofillExempt, useSetAutofillExempt } from "../hooks/useAutofill";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type BackfillRowCheckbox
  = | { mode: "interactive";
    checked: boolean;
    onToggle: () => void; }
    | { mode: "readonly" };

interface Props {
  entry: AutofillBackfillEntry;
  ruleId: string;
  checkbox: BackfillRowCheckbox;
}

export function AutofillBackfillRow({
  entry, ruleId, checkbox,
}: Props) {
  const {
    t,
  } = useTranslation();
  const setExempt = useSetAutofillExempt();
  const removeExempt = useRemoveAutofillExempt();
  const exemptPending = setExempt.isPending || removeExempt.isPending;

  return (
    <div className="flex items-start gap-3 rounded-md border px-3 py-2">
      {checkbox.mode === "interactive"
        ? (
          <Checkbox
            checked={checkbox.checked}
            onCheckedChange={checkbox.onToggle}
            disabled={entry.isExempt}
            className="mt-0.5 shrink-0"
            aria-label={t("Select {{title}}", {
              title: entry.bookmark.title,
            })}
          />
        )
        : (
          <Checkbox
            checked={entry.needsBackfill && !entry.isExempt}
            disabled
            className="mt-0.5 shrink-0"
            aria-hidden
          />
        )}
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
          : checkbox.mode === "interactive"
            ? (
              <Badge
                variant="outline"
                className="shrink-0 text-muted-foreground"
              >
                {t("Up to date")}
              </Badge>
            )
            : null}
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
