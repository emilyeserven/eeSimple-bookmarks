import type { BulkBookmarkTagOp, BulkUrlUpdate, CreateBookmarkInput, UpdateBookmarkInput, UpdateBookmarkRelationshipsInput } from "@eesimple/types";
import type { QueryClient } from "@tanstack/react-query";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bookmarksApi } from "../lib/api/bookmarks";
import { describeError } from "../lib/apiError";
import { notifyImageFetchError } from "../lib/bugReport";
import { notifyBulkResult } from "../lib/bulkResults";
import { notifyError, notifySuccess } from "../lib/notifications";

const BOOKMARKS_KEY = ["bookmarks"] as const;
const CATEGORIES_KEY = ["categories"] as const;
const MEDIA_TYPES_KEY = ["media-types"] as const;
const WEBSITES_KEY = ["websites"] as const;
const YOUTUBE_CHANNELS_KEY = ["youtube-channels"] as const;
const TAGS_KEY = ["tags"] as const;

/** Invalidate every query whose data a bookmark write can change (the list + all source counts). */
function invalidateBookmarkRelatedQueries(queryClient: QueryClient): void {
  for (const key of [BOOKMARKS_KEY, CATEGORIES_KEY, MEDIA_TYPES_KEY, WEBSITES_KEY, YOUTUBE_CHANNELS_KEY]) {
    void queryClient.invalidateQueries({
      queryKey: key,
    });
  }
}

/** Bookmarks whose URL host equals `domain` — powers the bulk shortened-link expansion review. */
export function useBookmarksOnHost(domain: string | null) {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, "on-host", domain],
    queryFn: () => bookmarksApi.onHost(domain ?? ""),
    enabled: Boolean(domain),
  });
}

/** Apply a batch of URL rewrites (e.g. expanding shortened links). */
export function useBulkExpandBookmarkUrls() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkUrlUpdate[]) => bookmarksApi.bulkUrl(items),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
    },
  });
}

export function useBookmarks(tagIds?: string[]) {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, tagIds ?? null],
    queryFn: () => bookmarksApi.list(tagIds),
  });
}

/** A single bookmark fetched by id; nested under the bookmarks key so edits invalidate it. */
export function useBookmark(id: string) {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, "detail", id],
    queryFn: () => bookmarksApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookmarkInput) => bookmarksApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CATEGORIES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: MEDIA_TYPES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: YOUTUBE_CHANNELS_KEY,
      });
    },
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateBookmarkInput; }) => bookmarksApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CATEGORIES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: MEDIA_TYPES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: YOUTUBE_CHANNELS_KEY,
      });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CATEGORIES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: MEDIA_TYPES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: YOUTUBE_CHANNELS_KEY,
      });
      notifySuccess("Bookmark deleted");
    },
  });
}

/** Delete many bookmarks at once; fires one summarizing toast. */
export function useBulkDeleteBookmarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bookmarksApi.bulkDelete(ids),
    onSuccess: (results) => {
      invalidateBookmarkRelatedQueries(queryClient);
      notifyBulkResult(results, "deleted");
    },
  });
}

/** Apply one partial patch (category / media type / property value) to many bookmarks at once. */
export function useBulkUpdateBookmarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids, patch,
    }: { ids: string[];
      patch: UpdateBookmarkInput; }) => bookmarksApi.bulkUpdate(ids, patch),
    onSuccess: (results) => {
      invalidateBookmarkRelatedQueries(queryClient);
      notifyBulkResult(results, "updated");
    },
  });
}

/** Add or remove a set of tags across many bookmarks at once. */
export function useBulkBookmarkTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids, tagIds, op,
    }: { ids: string[];
      tagIds: string[];
      op: BulkBookmarkTagOp; }) => bookmarksApi.bulkTags(ids, tagIds, op),
    onSuccess: (results) => {
      invalidateBookmarkRelatedQueries(queryClient);
      void queryClient.invalidateQueries({
        queryKey: TAGS_KEY,
      });
      notifyBulkResult(results, "updated");
    },
  });
}

/**
 * Apply the "auto-tag from title" automation to every existing bookmark (additive). Reports how many
 * bookmarks were tagged and refreshes the bookmark list + tag counts.
 */
export function useBackfillTitleTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => bookmarksApi.backfillTitleTags(),
    onSuccess: (result) => {
      invalidateBookmarkRelatedQueries(queryClient);
      void queryClient.invalidateQueries({
        queryKey: TAGS_KEY,
      });
      notifySuccess(
        result.tagsApplied === 0
          ? "No bookmark titles matched a tag name"
          : `Tagged ${result.updated} bookmark${result.updated === 1 ? "" : "s"} (${result.tagsApplied} tag${result.tagsApplied === 1 ? "" : "s"} applied)`,
      );
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not backfill tags from titles")),
  });
}

/** Upload an image file for an existing bookmark, replacing any current image. */
export function useUploadBookmarkImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, file,
    }: { id: string;
      file: File; }) => bookmarksApi.uploadImage(id, file),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
    onError: (err: Error) => notifyError(describeError(err, "Could not upload that image")),
  });
}

/** Auto-capture a bookmark's preview image from its page (og:image). */
export function useAutoBookmarkImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
    }: { id: string;
      sourceUrl: string; }) => bookmarksApi.autoImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      notifySuccess("Page image fetched");
    },
    onError: (err: Error, {
      sourceUrl,
    }) => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      notifyImageFetchError(err, "bookmark page image", "Could not fetch a preview image", sourceUrl);
    },
  });
}

/** Remove a bookmark's image. */
export function useDeleteBookmarkImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.deleteImage(id),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the image")),
  });
}

/** Take a Browserless screenshot and store it as the bookmark's screenshot image. */
export function useTakeBookmarkScreenshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, delayMs,
    }: { id: string;
      delayMs?: number; }) =>
      bookmarksApi.takeScreenshot(id, delayMs),
    onMutate: () => {
      const toastId = toast.loading("Generating screenshot…");
      return {
        toastId,
      };
    },
    onSuccess: (_, __, context) => {
      toast.dismiss(context?.toastId);
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      notifySuccess("Screenshot captured");
    },
    onError: (err: Error, _, context) => {
      toast.dismiss(context?.toastId);
      notifyError(describeError(err, "Could not capture a screenshot"));
    },
  });
}

/** Remove a bookmark's screenshot. */
export function useDeleteBookmarkScreenshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.deleteScreenshot(id),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the screenshot")),
  });
}

/** Upload an image/file value for a bookmark's image/file custom property, replacing any current one. */
export function useUploadBookmarkPropertyFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, propertyId, file,
    }: { id: string;
      propertyId: string;
      file: File; }) => bookmarksApi.uploadPropertyFile(id, propertyId, file),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
    onError: (err: Error) => notifyError(describeError(err, "Could not upload that file")),
  });
}

/** Remove a bookmark's image/file custom property value. */
export function useDeleteBookmarkPropertyFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, propertyId,
    }: { id: string;
      propertyId: string; }) => bookmarksApi.deletePropertyFile(id, propertyId),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the file")),
  });
}

/** Check if a URL (or its path) already exists as a bookmark. */
export function useBookmarkUrlDuplicateCheck() {
  return useMutation({
    mutationFn: (url: string) => bookmarksApi.urlCheck(url),
  });
}

/** Replace the full set of relationships for a bookmark. */
export function useUpdateBookmarkRelationships() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateBookmarkRelationshipsInput; }) =>
      bookmarksApi.updateRelationships(id, input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
  });
}
