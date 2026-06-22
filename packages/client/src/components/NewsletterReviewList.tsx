import type {
  NewsletterApproveResult,
  NewsletterBlacklistEntry,
  NewsletterImportItem,
  NewsletterImportItemStatus,
} from "@eesimple/types";

import { useMemo, useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Check, ExternalLink, Eye, Pencil, X } from "lucide-react";

import { useNewsletterBlacklist, useUpdateNewsletterBlacklist } from "../hooks/useAppSettings";
import { useCategories } from "../hooks/useCategories";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReviewFilter = "all" | "pending" | "issues";

/** Sentinel for the "no category" Select option (Radix forbids an empty-string item value). */
const NO_CATEGORY = "__none__";

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

/** Reject control: a dropdown offering "reject only" plus reject-and-blacklist by URL/domain/path. */
function RejectMenu({
  importId, item,
}: { importId: string;
  item: NewsletterImportItem; }) {
  const reject = useRejectImportItem(importId);
  const {
    data: blacklist = [],
  } = useNewsletterBlacklist();
  const updateBlacklist = useUpdateNewsletterBlacklist();
  const patterns = item.url ? blacklistPatternsFor(item.url) : null;

  function rejectOnly() {
    reject.mutate(item.id, {
      onSuccess: () => notifySuccess("Rejected link"),
    });
  }

  function blockAndReject(entry: NewsletterBlacklistEntry, message: string) {
    const exists = blacklist.some(e => e.kind === entry.kind && e.value === entry.value);
    if (!exists) updateBlacklist.mutate([...blacklist, entry]);
    reject.mutate(item.id, {
      onSuccess: () => notifySuccess(message),
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Reject"
          disabled={reject.isPending}
        >
          <X className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={rejectOnly}>Reject only</DropdownMenuItem>
        {patterns
          ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => blockAndReject(patterns.exact, "Rejected & blocked this URL")}
              >
                Reject &amp; block this URL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => blockAndReject(patterns.domain, `Rejected & blocked ${patterns.domain.value}`)}
              >
                Reject &amp; block this domain
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => blockAndReject(patterns.pathPrefix, "Rejected & blocked this path")}
              >
                Reject &amp; block this page path
              </DropdownMenuItem>
            </>
          )
          : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A "View bookmark" link button shown on approved/duplicate rows. */
function ViewBookmarkButton({
  bookmarkId,
}: { bookmarkId: string }) {
  return (
    <Button
      asChild
      size="icon"
      variant="ghost"
      aria-label="View bookmark"
    >
      <Link
        to="/bookmarks/$bookmarkId"
        params={{
          bookmarkId,
        }}
      >
        <Eye className="size-4" />
      </Link>
    </Button>
  );
}

/** The expanded edit form for one candidate (url/title/description/category). Owns its own draft. */
function ReviewRowEditor({
  importId, item, onDone,
}: { importId: string;
  item: NewsletterImportItem;
  onDone: () => void; }) {
  const update = useUpdateImportItem(importId);
  const {
    data: categories = [],
  } = useCategories();
  const [draft, setDraft] = useState({
    url: item.url ?? "",
    title: item.title ?? "",
    description: item.description ?? "",
    categoryId: item.categoryId ?? "",
  });

  function onSave() {
    update.mutate(
      {
        itemId: item.id,
        input: {
          url: draft.url,
          title: draft.title || null,
          description: draft.description || null,
          categoryId: draft.categoryId || null,
        },
      },
      {
        onSuccess: () => {
          notifySuccess("Updated candidate");
          onDone();
        },
        onError: () => notifyError("Couldn't save candidate"),
      },
    );
  }

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
      <Select
        value={draft.categoryId || NO_CATEGORY}
        onValueChange={value => setDraft(d => ({
          ...d,
          categoryId: value === NO_CATEGORY ? "" : value,
        }))}
      >
        <SelectTrigger aria-label="Category">
          <SelectValue placeholder="Category (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_CATEGORY}>No category</SelectItem>
          {categories.map(category => (
            <SelectItem
              key={category.id}
              value={category.id}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
          onClick={onDone}
        >Cancel
        </Button>
      </div>
    </RowCard>
  );
}

function ReviewRow({
  importId, item,
}: { importId: string;
  item: NewsletterImportItem; }) {
  const approve = useApproveImportItem(importId);
  const {
    data: categories = [],
  } = useCategories();
  const [editing, setEditing] = useState(false);

  const muted = item.status === "rejected" || item.status === "approved" || item.status === "duplicate";
  const categoryName = categories.find(c => c.id === item.categoryId)?.name ?? null;
  const resultBookmarkId = item.createdBookmarkId ?? item.duplicateBookmarkId;

  function onApprove() {
    approve.mutate(item.id, {
      onSuccess: notifyApprove,
    });
  }

  if (editing) {
    return (
      <ReviewRowEditor
        importId={importId}
        item={item}
        onDone={() => setEditing(false)}
      />
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
          <div className="flex items-start gap-2">
            <p className="min-w-0 font-medium wrap-break-word">{item.title || item.anchorText || item.url || item.rawUrl}</p>
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
          {categoryName
            ? <p className="text-xs text-muted-foreground">Category: {categoryName}</p>
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
                <RejectMenu
                  importId={importId}
                  item={item}
                />
              </>
            )
            : null}
          {item.status !== "pending" && resultBookmarkId
            ? <ViewBookmarkButton bookmarkId={resultBookmarkId} />
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
