import type { OrphanDeleteResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import {
  useDeleteOrphanBookmarks,
  useDeleteOrphanInboxItems,
  useOrphanCounts,
} from "../hooks/useMaintenance";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OrphanKind = "bookmarks" | "inboxItems";

/** One orphan-cleanup row: a label, the live count, and a destructive button that opens the dialog. */
function OrphanRow({
  title,
  description,
  count,
  noun,
  onDelete,
}: {
  title: string;
  description: string;
  count: number;
  noun: string;
  onDelete: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div
      className="
        flex flex-col gap-2
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        variant="destructive"
        disabled={count === 0}
        onClick={onDelete}
        className="shrink-0"
      >
        {count === 0
          ? t("No {{noun}}", {
            noun,
          })
          : t("Delete {{count}} {{noun}}", {
            count,
            noun,
          })}
      </Button>
    </div>
  );
}

/**
 * Advanced housekeeping: report and sweep orphaned records — bookmarks with no category and inbox
 * items whose import has no newsletter. Each delete confirms via a dialog showing the count and fires
 * a recorded toast (mirroring the Gallery orphan cleanup).
 */
export function OrphanCleanupCard() {
  const {
    t,
  } = useTranslation();
  const {
    data, isLoading,
  } = useOrphanCounts();
  const deleteBookmarks = useDeleteOrphanBookmarks();
  const deleteInboxItems = useDeleteOrphanInboxItems();
  // Which delete the confirmation dialog is currently asking about (null = closed).
  const [pending, setPending] = useState<OrphanKind | null>(null);

  const bookmarkCount = data?.bookmarks ?? 0;
  const inboxCount = data?.inboxItems ?? 0;

  const config: Record<OrphanKind, {
    count: number;
    noun: string;
    mutation: UseMutationResult<OrphanDeleteResult, Error, void>;
  }> = {
    bookmarks: {
      count: bookmarkCount,
      noun: t("bookmarks"),
      mutation: deleteBookmarks,
    },
    inboxItems: {
      count: inboxCount,
      noun: t("inbox items"),
      mutation: deleteInboxItems,
    },
  };

  const active = pending ? config[pending] : null;

  function onConfirm(): void {
    if (!active) return;
    const {
      noun, mutation,
    } = active;
    mutation.mutate(undefined, {
      onSuccess: ({
        deleted,
      }) => {
        notifySuccess(t("Deleted {{deleted}} orphaned {{noun}}", {
          deleted,
          noun,
        }));
        setPending(null);
      },
      onError: error => notifyError(error.message),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Clean up orphaned items")}</CardTitle>
        <CardDescription>
          {t("Permanently delete records that have lost their parent. This can't be undone.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading
          ? <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
          : (
            <>
              <OrphanRow
                title={t("Bookmarks without a category")}
                description={t("Bookmarks whose category was removed and never reassigned.")}
                count={bookmarkCount}
                noun={t("bookmarks")}
                onDelete={() => setPending("bookmarks")}
              />
              <OrphanRow
                title={t("Inbox items without a newsletter")}
                description={t("Inbox items from newsletter imports whose newsletter was deleted. Extension quick-saves are excluded. Created bookmarks are kept.")}
                count={inboxCount}
                noun={t("inbox items")}
                onDelete={() => setPending("inboxItems")}
              />
            </>
          )}
      </CardContent>

      <Dialog
        open={pending !== null}
        onOpenChange={open => !open && setPending(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete orphaned items?")}</DialogTitle>
            <DialogDescription>
              {active
                ? t("This permanently deletes {{count}} {{noun}}. This can't be undone.", {
                  count: active.count,
                  noun: active.noun,
                })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPending(null)}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={active?.mutation.isPending}
              onClick={onConfirm}
            >
              {active?.mutation.isPending ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
