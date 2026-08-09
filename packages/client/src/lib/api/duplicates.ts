import type { Bookmark, DuplicateScanResult, MergeBookmarksInput } from "@eesimple/types";

import { request } from "./client";

/** Duplicates manager: the whole-collection duplicate scan and the merge-a-group write. */
export const duplicatesApi = {
  scan: () => request<DuplicateScanResult>("/duplicates"),
  merge: (input: MergeBookmarksInput) =>
    request<Bookmark>("/duplicates/merge", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
