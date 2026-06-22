import type {
  IngestPasteInput,
  IngestUrlInput,
  UpdateNewsletterImportItemInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { newsletterApi } from "../lib/api";

const NEWSLETTER_KEY = ["newsletter-imports"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

/** List all newsletter imports with per-status counts (newest first). */
export function useNewsletterImports() {
  return useQuery({
    queryKey: NEWSLETTER_KEY,
    queryFn: newsletterApi.listImports,
  });
}

/** One newsletter import with its candidate items. */
export function useNewsletterImport(id: string) {
  return useQuery({
    queryKey: [...NEWSLETTER_KEY, id],
    queryFn: () => newsletterApi.getImport(id),
    enabled: Boolean(id),
  });
}

/** Invalidate the import list (and a specific import when given). */
function useInvalidateNewsletter() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({
      queryKey: NEWSLETTER_KEY,
    });
    if (id) void queryClient.invalidateQueries({
      queryKey: [...NEWSLETTER_KEY, id],
    });
  };
}

export function useIngestPaste() {
  const invalidate = useInvalidateNewsletter();
  return useMutation({
    mutationFn: (input: IngestPasteInput) => newsletterApi.ingestPaste(input),
    onSuccess: () => invalidate(),
  });
}

export function useIngestUrl() {
  const invalidate = useInvalidateNewsletter();
  return useMutation({
    mutationFn: (input: IngestUrlInput) => newsletterApi.ingestUrl(input),
    onSuccess: () => invalidate(),
  });
}

export function useIngestUpload() {
  const invalidate = useInvalidateNewsletter();
  return useMutation({
    mutationFn: ({
      file, enrich, newsletterId, defaultCategoryId,
    }: { file: File;
      enrich: boolean;
      newsletterId?: string | null;
      defaultCategoryId?: string | null; }) =>
      newsletterApi.ingestUpload(file, enrich, newsletterId, defaultCategoryId),
    onSuccess: () => invalidate(),
  });
}

const ISSUES_KEY = ["newsletter-issues"] as const;

/** List the issues (= imports) belonging to one newsletter. */
export function useNewsletterIssues(newsletterId: string) {
  return useQuery({
    queryKey: [...ISSUES_KEY, newsletterId],
    queryFn: () => newsletterApi.listIssues(newsletterId),
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
    mutationFn: (bookmarkIds: string[]) => newsletterApi.addIssueBookmarks(importId, bookmarkIds),
    onSuccess: () => invalidate(),
  });
}

export function useRemoveIssueBookmarks(importId: string) {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: (bookmarkIds: string[]) => newsletterApi.removeIssueBookmarks(importId, bookmarkIds),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateImportItem(importId: string) {
  const invalidate = useInvalidateNewsletter();
  return useMutation({
    mutationFn: ({
      itemId, input,
    }: { itemId: string;
      input: UpdateNewsletterImportItemInput; }) =>
      newsletterApi.updateItem(importId, itemId, input),
    onSuccess: () => invalidate(importId),
  });
}

export function useApproveImportItem(importId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNewsletter();
  return useMutation({
    mutationFn: (itemId: string) => newsletterApi.approveItem(importId, itemId),
    onSuccess: () => {
      invalidate(importId);
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useApproveImport(importId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNewsletter();
  return useMutation({
    mutationFn: () => newsletterApi.approveImport(importId),
    onSuccess: () => {
      invalidate(importId);
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useRejectImportItem(importId: string) {
  const invalidate = useInvalidateNewsletter();
  return useMutation({
    mutationFn: (itemId: string) => newsletterApi.rejectItem(importId, itemId),
    onSuccess: () => invalidate(importId),
  });
}

export function useDeleteNewsletterImport() {
  const invalidate = useInvalidateNewsletter();
  const invalidateIssues = useInvalidateIssues();
  return useMutation({
    mutationFn: (id: string) => newsletterApi.deleteImport(id),
    onSuccess: () => {
      invalidate();
      // Deleting an import removes it from its newsletter's issue list and nulls its bookmarks' links.
      invalidateIssues();
    },
  });
}
