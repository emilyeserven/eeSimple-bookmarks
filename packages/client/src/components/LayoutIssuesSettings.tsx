import type { EntityLayoutRecord } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { useClearInvalidLayout, useInvalidEntityLayouts } from "../hooks/useEntityLayouts";
import { describeError } from "../lib/apiError";
import { copyText } from "../lib/clipboard";
import { formatLayoutIssueDebug } from "../lib/layoutIssueDebug";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Settings → Advanced → Layout Issues: lists every stored page layout the server flagged as
 * structurally invalid (and therefore resolved to its code default), with the specific reasons, the
 * raw stored JSON, a "Copy debug info" button (prompt-ready blob), and a confirm-gated "Reset to
 * default" that clears the corrupt row. Empty when every saved layout is valid.
 */
export function LayoutIssuesSettings() {
  const {
    t,
  } = useTranslation();
  const invalidLayouts = useInvalidEntityLayouts();

  if (invalidLayouts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No layout issues — every saved page layout is valid.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {invalidLayouts.map(record => (
        <LayoutIssueCard
          key={record.entityKind}
          record={record}
        />
      ))}
    </div>
  );
}

function LayoutIssueCard({
  record,
}: { record: EntityLayoutRecord }) {
  const {
    t,
  } = useTranslation();
  const [resetOpen, setResetOpen] = useState(false);
  const clearInvalid = useClearInvalidLayout();

  async function handleCopy(): Promise<void> {
    try {
      await copyText(formatLayoutIssueDebug(record));
      notifySuccess(t("Debug info copied"));
    }
    catch (error) {
      notifyError(describeError(error));
    }
  }

  function handleReset(): void {
    clearInvalid.mutate(record.entityKind, {
      onSuccess: () => {
        setResetOpen(false);
        notifySuccess(t("Layout reset to default"));
      },
      onError: error => notifyError(describeError(error)),
    });
  }

  return (
    <RowCard className="space-y-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">
          <code className="text-sm">{record.entityKind}</code>
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("Saved {{when}}", {
            when: record.updatedAt,
          })}
        </span>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">{t("What's wrong")}</p>
        <ul
          className="
            list-inside list-disc space-y-0.5 text-sm text-muted-foreground
          "
        >
          {(record.issues ?? []).map((issue, i) => (
            <li key={i}>
              <code>{issue}</code>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">{t("Raw stored layout")}</p>
        <div
          className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3"
        >
          <pre className="text-xs">{JSON.stringify(record.rawLayout ?? null, null, 2)}</pre>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleCopy()}
        >
          {t("Copy debug info")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setResetOpen(true)}
        >
          {t("Reset to default")}
        </Button>
      </div>

      <Dialog
        open={resetOpen}
        onOpenChange={(next) => {
          if (!next) setResetOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Reset “{{kind}}” layout to default?", {
                kind: record.entityKind,
              })}
            </DialogTitle>
            <DialogDescription>
              {t("This deletes the corrupted saved layout for this entity and restores the built-in default. This can't be undone.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("Cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={clearInvalid.isPending}
              onClick={handleReset}
            >
              {clearInvalid.isPending ? t("Resetting…") : t("Reset")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RowCard>
  );
}
