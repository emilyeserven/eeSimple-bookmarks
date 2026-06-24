import type {
  ActiveImport,
  BlockImportItemInput,
  IngestPasteInput,
  IngestUrlInput,
} from "@eesimple/types";

import { useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { importApi } from "../lib/api/imports";
import { notifyError, notifySuccess } from "../lib/notifications";

const IMPORTS_KEY = ["imports"] as const;
const ACTIVE_KEY = ["imports", "active"] as const;
const INBOX_KEY = ["inbox-items"] as const;
const ISSUES_KEY = ["newsletter-issues"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const IMPORT_BLACKLIST_KEY = ["app-settings", "import-blacklist"] as const;

/** How often (ms) to poll active imports while any are in flight. */
const ACTIVE_POLL_MS = 1500;

/** Every import item across all imports — the Inbox review queue. */
export function useInboxItems() {
  return useQuery({
    queryKey: INBOX_KEY,
    queryFn: importApi.listInboxItems,
  });
}

/**
 * Poll the in-flight imports (queued/processing) for the header progress indicator. Self-stopping:
 * it only refetches on an interval while at least one import is active, then idles until an ingest
 * invalidates the key. Ingest mutations invalidate this key, so polling kicks off on submit.
 */
export function useActiveImports() {
  return useQuery({
    queryKey: ACTIVE_KEY,
    queryFn: importApi.listActive,
    refetchInterval: query =>
      (query.state.data && query.state.data.length > 0 ? ACTIVE_POLL_MS : false),
  });
}

/**
 * Watch the active-import poll and fire a toast when each import leaves the queue (completed or
 * failed), refreshing the Inbox so the newly-staged links appear. Mount once (the header indicator);
 * it tracks the previously-active set in a ref to detect transitions.
 */
export function useImportCompletionToasts(active: ActiveImport[] | undefined) {
  const queryClient = useQueryClient();
  const previous = useRef<Map<string, ActiveImport>>(new Map());
  useEffect(() => {
    const current = new Map((active ?? []).map(item => [item.id, item]));
    for (const [id, item] of previous.current) {
      if (current.has(id)) continue;
      // This import just left the active set — resolve its final state and toast accordingly.
      void importApi.getImport(id).then((record) => {
        const label = item.sourceLabel ? ` from ${item.sourceLabel}` : "";
        if (record.status === "failed") {
          notifyError(`Import${label} failed${record.errorReason ? `: ${record.errorReason}` : "."}`);
          return;
        }
        const count = record.items.length;
        notifySuccess(`Imported ${count} link${count === 1 ? "" : "s"}${label} for review`, {
          link: {
            href: "/inbox",
            label: "Review in Inbox",
          },
        });
      }).catch(() => {
        // Best-effort notification; the Inbox refresh below still surfaces the links.
      });
    }
    if (current.size !== previous.current.size || [...current.keys()].some(id => !previous.current.has(id))) {
      void queryClient.invalidateQueries({
        queryKey: INBOX_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: IMPORTS_KEY,
      });
    }
    previous.current = current;
  }, [active, queryClient]);
}

/** Invalidate the Inbox queue and the import summaries (their counts move together). */
function useInvalidateInbox() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: INBOX_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: IMPORTS_KEY,
    });
    // Kick the active-import poll so the header indicator picks up the just-queued import.
    void queryClient.invalidateQueries({
      queryKey: ACTIVE_KEY,
    });
  };
}

export function useIngestPaste() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: (input: IngestPasteInput) => importApi.ingestPaste(input),
    onSuccess: () => invalidate(),
  });
}

export function useIngestUrl() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: (input: IngestUrlInput) => importApi.ingestUrl(input),
    onSuccess: () => invalidate(),
  });
}

export function useIngestUpload() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: ({
      file, newsletterId, defaultCategoryId,
    }: { file: File;
      newsletterId?: string | null;
      defaultCategoryId?: string | null; }) =>
      importApi.ingestUpload(file, newsletterId, defaultCategoryId),
    onSuccess: () => invalidate(),
  });
}

/** List the issues (= imports) belonging to one newsletter. */
export function useNewsletterIssues(newsletterId: string) {
  return useQuery({
    queryKey: [...ISSUES_KEY, newsletterId],
    queryFn: () => importApi.listIssues(newsletterId),
    enabled: Boolean(newsletterId),
  });
}

/** Invalidate the per-newsletter issue lists and the bookmark list. */
function useInvalidateIssues() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: ISSUES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useAddIssueBookmarks(importId: string) {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: (bookmarkIds: string[]) => importApi.addIssueBookmarks(importId, bookmarkIds),
    onSuccess: () => invalidate(),
  });
}

export function useRemoveIssueBookmarks(importId: string) {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: (bookmarkIds: string[]) => importApi.removeIssueBookmarks(importId, bookmarkIds),
    onSuccess: () => invalidate(),
  });
}

export function useApproveImportItem() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: (itemId: string) => importApi.approveItem(itemId),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useRejectImportItem() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: (itemId: string) => importApi.rejectItem(itemId),
    onSuccess: () => invalidate(),
  });
}

export function useUnrejectImportItem() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: (itemId: string) => importApi.unrejectItem(itemId),
    onSuccess: () => invalidate(),
  });
}

export function useBlockImportItem() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: ({
      itemId, entry,
    }: { itemId: string;
      entry: BlockImportItemInput; }) =>
      importApi.blockItem(itemId, entry),
    onSuccess: () => {
      invalidate();
      // Blocking adds a blacklist entry, so the Imports Blacklist view must refresh too.
      void queryClient.invalidateQueries({
        queryKey: IMPORT_BLACKLIST_KEY,
      });
    },
  });
}

export function useDeleteImport() {
  const invalidate = useInvalidateInbox();
  const invalidateIssues = useInvalidateIssues();
  return useMutation({
    mutationFn: (id: string) => importApi.deleteImport(id),
    onSuccess: () => {
      invalidate();
      // Deleting an import removes it from its newsletter's issue list and nulls its bookmarks' links.
      invalidateIssues();
    },
  });
}

/** Delete every processed item (approved/marked-for-deletion + blocked). Keeps the blacklist. */
export function usePurgeProcessedItems() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: () => importApi.purgeProcessed(),
    onSuccess: () => invalidate(),
  });
}

/** Reject every pending candidate across all imports (the Inbox "reject all pending" action). */
export function useRejectPendingItems() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: () => importApi.rejectPending(),
    onSuccess: () => invalidate(),
  });
}

/** Re-check every pending candidate against the block list (the Inbox "recheck block list" action). */
export function useRecheckPendingItems() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: () => importApi.recheckPending(),
    onSuccess: () => invalidate(),
  });
}

/** Delete every rejected candidate across all imports (the Inbox "delete all rejected" action). */
export function useDeleteRejectedItems() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: () => importApi.deleteRejected(),
    onSuccess: () => invalidate(),
  });
}
