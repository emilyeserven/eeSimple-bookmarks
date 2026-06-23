import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { maintenanceApi } from "../lib/api/imports";

const ORPHANS_KEY = ["maintenance", "orphans"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const INBOX_KEY = ["inbox-items"] as const;
const IMPORTS_KEY = ["imports"] as const;

/** Counts of orphaned records eligible for cleanup (bookmarks with no category, newsletter-less inbox items). */
export function useOrphanCounts() {
  return useQuery({
    queryKey: ORPHANS_KEY,
    queryFn: maintenanceApi.getOrphanCounts,
  });
}

/** Delete every bookmark with no category, then refresh the counts and the bookmark list. */
export function useDeleteOrphanBookmarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => maintenanceApi.deleteOrphanBookmarks(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ORPHANS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

/** Delete every inbox item whose import has no newsletter, then refresh the counts and the Inbox. */
export function useDeleteOrphanInboxItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => maintenanceApi.deleteOrphanInboxItems(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ORPHANS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: INBOX_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: IMPORTS_KEY,
      });
    },
  });
}
