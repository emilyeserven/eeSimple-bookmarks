import type { FastifyInstance } from "fastify";
import type { Bookmark, DuplicateScanResult, MergeBookmarksInput } from "@eesimple/types";
import { mergeBody } from "@/routes/duplicatesSchema";
import { scanDuplicateGroups } from "@/services/bookmarkDuplicateGroups";
import { mergeBookmarks } from "@/services/bookmarkMerge";

/**
 * Duplicates manager routes for the Advanced settings page: an on-demand whole-collection
 * duplicate scan (pure DB work — synchronous, unlike the Link Health background job) and the
 * merge-a-group-into-one-survivor write.
 */
export async function duplicatesRoutes(app: FastifyInstance): Promise<void> {
  // Scan every bookmark and return the duplicate groups, tiered by confidence.
  app.get("/api/duplicates", {
    schema: {
      tags: ["duplicates"],
    },
  }, async (): Promise<DuplicateScanResult> => scanDuplicateGroups());

  // Merge a duplicate group into one survivor. Scalars follow the per-field picks;
  // associations are unioned; the losers are deleted. Returns the hydrated survivor.
  app.post("/api/duplicates/merge", {
    schema: {
      tags: ["duplicates"],
      body: mergeBody,
    },
  }, async (req): Promise<Bookmark> => mergeBookmarks(req.body as MergeBookmarksInput));
}
