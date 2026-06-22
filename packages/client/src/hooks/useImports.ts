import type {
  BlockImportItemInput,
  IngestPasteInput,
  IngestUrlInput,
  UpdateImportItemInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { importApi } from "../lib/api";

const IMPORTS_KEY = ["imports"] as const;
const INBOX_KEY = ["inbox-items"] as const;
const ISSUES_KEY = ["newsletter-issues"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const IMPORT_BLACKLIST_KEY = ["app-settings", "import-blacklist"] as const;

/** List all imports with per-status counts (newest first). */
export function useImports() {
  return useQuery({
    queryKey: IMPORTS_KEY,
    queryFn: importApi.listImports,
  });
}

/** One import with its candidate items. */
export function useImport(id: string) {
  return useQuery({
    queryKey: [...IMPORTS_KEY, id],
    queryFn: () => importApi.getImport(id),
    enabled: Boolean(id),
  });
}

/** Every import item across all imports — the Inbox review queue. */
export function useInboxItems() {
  return useQuery({
    queryKey: INBOX_KEY,
    queryFn: importApi.listInboxItems,
  });
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

export function useUpdateImportItem() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: ({
      itemId, input,
    }: { itemId: string;
      input: UpdateImportItemInput; }) =>
      importApi.updateItem(itemId, input),
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

export function useApproveImport(importId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: () => importApi.approveImport(importId),
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
