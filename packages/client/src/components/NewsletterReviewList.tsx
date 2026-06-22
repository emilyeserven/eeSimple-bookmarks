import type {
  NewsletterApproveResult,
  NewsletterImportItem,
  NewsletterImportItemStatus,
} from "@eesimple/types";

import { useMemo, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Check, ExternalLink, Pencil, X } from "lucide-react";

import {
  useApproveImport,
  useApproveImportItem,
  useRejectImportItem,
  useUpdateImportItem,
} from "../hooks/useNewsletterImports";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ReviewFilter = "all" | "pending" | "issues";

const STATUS_META: Record<NewsletterImportItemStatus, { label: string;
  variant: "secondary" | "default" | "destructive" | "outline"; }> = {
  pending: {
    label: "Pending",
    variant: "secondary",
  },
  approved: {
    label: "Added",
    variant: "default",
  },
  duplicate: {
    label: "Already saved",
    variant: "outline",
  },
  rejected: {
    label: "Rejected",
    variant: "outline",
  },
  error: {
    label: "Error",
    variant: "destructive",
  },
};

/** Surface the outcome of an approve call (one item or a bulk run) as a recorded toast. */
function notifyApprove(result: NewsletterApproveResult): void {
  if (result.status === "approved") notifySuccess("Bookmark added");
  else if (result.status === "duplicate") notifyError(result.message ?? "Already saved as a bookmark");
  else if (result.status === "error") notifyError(result.message ?? "Couldn't add bookmark");
}

function StatusBadge({
  item,
}: { item: NewsletterImportItem }) {
  const meta = STATUS_META[item.status];
  const bookmarkId = item.createdBookmarkId ?? item.duplicateBookmarkId;
  if (bookmarkId) {
    return (
      <Link
        to="/bookmarks/$bookmarkId"
        params={{
          bookmarkId,
        }}
      >
        <Badge
          variant={meta.variant}
          className="cursor-pointer"
        >{meta.label}
        </Badge>
      </Link>
    );
  }
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function ReviewRow({
  importId, item,
}: { importId: string;
  item: NewsletterImportItem; }) {
  const approve = useApproveImportItem(importId);
  const reject = useRejectImportItem(importId);
  const update = useUpdateImportItem(importId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    url: item.url ?? "",
    title: item.title ?? "",
    description: item.description ?? "",
  });

  const muted = item.status === "rejected" || item.status === "approved" || item.status === "duplicate";

  function onApprove() {
    approve.mutate(item.id, {
      onSuccess: notifyApprove,
    });
  }

  function onSave() {
    update.mutate(
      {
        itemId: item.id,
        input: {
          url: draft.url,
          title: draft.title || null,
          description: draft.description || null,
        },
      },
      {
        onSuccess: () => {
          notifySuccess("Updated candidate");
          setEditing(false);
        },
        onError: () => notifyError("Couldn't save candidate"),
      },
    );
  }

  if (editing) {
    return (
      <RowCard className="space-y-2 p-4">
        <Input
          value={draft.url}
          onChange={event => setDraft(d => ({
            ...d,
            url: event.target.value,
          }))}
          placeholder="URL"
          aria-label="URL"
        />
        <Input
          value={draft.title}
          onChange={event => setDraft(d => ({
            ...d,
            title: event.target.value,
          }))}
          placeholder="Title"
          aria-label="Title"
        />
        <Textarea
          value={draft.description}
          onChange={event => setDraft(d => ({
            ...d,
            description: event.target.value,
          }))}
          placeholder="Description"
          rows={2}
          aria-label="Description"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onSave}
            disabled={update.isPending}
          >Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(false)}
          >Cancel
          </Button>
        </div>
      </RowCard>
    );
  }

  return (
    <RowCard
      className={`
        p-4
        ${muted ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {item.imageUrl
          ? (
            <img
              src={item.imageUrl}
              alt=""
              className="size-12 shrink-0 rounded-sm object-cover"
            />
          )
          : null}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate font-medium">{item.title || item.anchorText || item.url || item.rawUrl}</p>
            <StatusBadge item={item} />
          </div>
          {item.url
            ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center gap-1 truncate text-sm text-muted-foreground
                  hover:underline
                "
              >
                <ExternalLink className="size-3 shrink-0" />
                <span className="truncate">{item.url}</span>
              </a>
            )
            : null}
          {item.url && item.rawUrl !== item.url
            ? <p className="truncate text-xs text-muted-foreground/70">via {item.rawUrl}</p>
            : null}
          {item.status === "error" && item.errorReason
            ? <p className="text-xs text-destructive">{item.errorReason}</p>
            : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {item.status === "pending"
            ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onApprove}
                  disabled={approve.isPending}
                  aria-label="Approve"
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditing(true)}
                  aria-label="Edit"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => reject.mutate(item.id)}
                  disabled={reject.isPending}
                  aria-label="Reject"
                >
                  <X className="size-4" />
                </Button>
              </>
            )
            : null}
        </div>
      </div>
    </RowCard>
  );
}

/** The review queue: filterable list of candidate items + a bulk "approve all pending" action. */
export function NewsletterReviewList({
  importId,
  items,
}: {
  importId: string;
  items: NewsletterImportItem[];
}) {
  const approveAll = useApproveImport(importId);
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const pendingCount = useMemo(() => items.filter(i => i.status === "pending").length, [items]);
  const filtered = useMemo(() => items.filter((item) => {
    if (filter === "pending") return item.status === "pending";
    if (filter === "issues") return item.status === "error" || item.status === "duplicate";
    return true;
  }), [items, filter]);

  function onApproveAll() {
    approveAll.mutate(undefined, {
      onSuccess: (results) => {
        const added = results.filter(r => r.status === "approved").length;
        notifySuccess(`Added ${added} bookmark${added === 1 ? "" : "s"}`);
      },
      onError: () => notifyError("Couldn't approve all candidates"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["all", "pending", "issues"] as const).map(value => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "secondary" : "ghost"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : value === "pending" ? "Pending" : "Issues"}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={onApproveAll}
          disabled={approveAll.isPending || pendingCount === 0}
        >
          {approveAll.isPending ? "Approving…" : `Approve all pending (${pendingCount})`}
        </Button>
      </div>

      {filtered.length === 0
        ? <p className="text-sm text-muted-foreground">No candidates to show.</p>
        : (
          <ul className="space-y-2">
            {filtered.map(item => (
              <li key={item.id}>
                <ReviewRow
                  importId={importId}
                  item={item}
                />
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
