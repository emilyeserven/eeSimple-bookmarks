import type { BrokenBookmark } from "@eesimple/types";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Link2, RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useDeleteBookmark } from "../hooks/useBookmarks";
import {
  BROKEN_LINKS_KEY,
  useBrokenBookmarks,
  useLinkCheckStatus,
  useRecheckBookmarkLink,
  useStartLinkCheck,
} from "../hooks/useLinkHealth";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Badge } from "@/components/ui/badge";
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

/** One broken-bookmark row: title link, URL, failure badge, checked time, re-check + delete. */
function BrokenLinkRow({
  bookmark,
  onDelete,
}: {
  bookmark: BrokenBookmark;
  onDelete: (bookmark: BrokenBookmark) => void;
}) {
  const {
    t,
  } = useTranslation();
  const recheck = useRecheckBookmarkLink();

  const detailLabels: Record<string, string> = {
    timeout: t("Timed out"),
    network_error: t("Network error"),
    blocked: t("Blocked URL"),
  };
  const detail = bookmark.detail
    ? detailLabels[bookmark.detail] ?? t("HTTP {{status}}", {
      status: bookmark.detail,
    })
    : t("Broken");

  function onRecheck(): void {
    recheck.mutate(bookmark.id, {
      onSuccess: (result) => {
        if (result.status === "ok") {
          notifySuccess(t("Link is working again."));
        }
        else {
          notifySuccess(t("Still broken."));
        }
      },
      onError: error => notifyError(error.message),
    });
  }

  return (
    <li
      className="
        flex flex-col gap-2 py-3
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/bookmarks/$bookmarkId/edit"
            params={{
              bookmarkId: bookmark.id,
            }}
            className="
              text-sm font-medium underline-offset-2
              hover:underline
            "
          >
            {bookmark.title}
          </Link>
          <Badge variant="destructive">{detail}</Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">{bookmark.url}</p>
        {bookmark.checkedAt
          ? (
            <p className="text-xs text-muted-foreground">
              {t("Checked {{when}}", {
                when: new Date(bookmark.checkedAt).toLocaleString(),
              })}
            </p>
          )
          : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={recheck.isPending}
          onClick={onRecheck}
        >
          <RefreshCw className="size-4" />
          {recheck.isPending ? t("Checking…") : t("Re-check")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDelete(bookmark)}
        >
          <Trash2 className="size-4" />
          {t("Delete")}
        </Button>
      </div>
    </li>
  );
}

/** The broken-bookmarks list with a per-row delete confirmation dialog. */
function BrokenLinksList({
  broken,
}: {
  broken: BrokenBookmark[];
}) {
  const {
    t,
  } = useTranslation();
  const queryClient = useQueryClient();
  const deleteBookmark = useDeleteBookmark();
  // The bookmark the delete confirmation dialog is currently asking about (null = closed).
  const [pendingDelete, setPendingDelete] = useState<BrokenBookmark | null>(null);

  function onConfirmDelete(): void {
    if (!pendingDelete) return;
    deleteBookmark.mutate(pendingDelete.id, {
      onSuccess: () => {
        notifySuccess(t("Deleted \"{{title}}\"", {
          title: pendingDelete.title,
        }));
        void queryClient.invalidateQueries({
          queryKey: BROKEN_LINKS_KEY,
        });
        setPendingDelete(null);
      },
      onError: error => notifyError(error.message),
    });
  }

  return (
    <>
      <ul className="divide-y">
        {broken.map(bookmark => (
          <BrokenLinkRow
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={setPendingDelete}
          />
        ))}
      </ul>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete bookmark?")}</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? t("This permanently deletes \"{{title}}\". This can't be undone.", {
                  title: pendingDelete.title,
                })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBookmark.isPending}
              onClick={onConfirmDelete}
            >
              {deleteBookmark.isPending ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Link Health: run an on-demand dead-link check over every bookmark URL (a background job — progress
 * shows in the header while it runs) and list the bookmarks whose last check failed, with per-row
 * re-check and delete.
 */
export function LinkHealthCard() {
  const {
    t,
  } = useTranslation();
  const startCheck = useStartLinkCheck();
  const {
    data: status,
  } = useLinkCheckStatus();
  const running = status?.status === "running";
  const {
    data: broken, isLoading,
  } = useBrokenBookmarks();
  const brokenCount = broken?.length ?? 0;

  function onStart(): void {
    startCheck.mutate(undefined, {
      onError: error => notifyError(error.message),
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Check all links")}</CardTitle>
          <CardDescription>
            {t("Visit every bookmark URL and record whether it still works. Runs as a background job, batched to avoid hammering servers — progress shows in the header while it runs.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={startCheck.isPending || running}
            onClick={onStart}
          >
            <Link2 className="size-4" />
            {running ? t("Checking…") : t("Check all links")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Broken links")}</CardTitle>
          <CardDescription>
            {t("Bookmarks whose last link check failed. Fix the URL from the bookmark's edit page, or delete the bookmark.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading
            ? <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
            : brokenCount === 0
              ? <p className="text-sm text-muted-foreground">{t("No broken links found.")}</p>
              : <BrokenLinksList broken={broken ?? []} />}
        </CardContent>
      </Card>
    </div>
  );
}
