import type { FastifyInstance } from "fastify";
import { countOrphanedBookmarks, deleteOrphanedBookmarks } from "@/services/bookmarks";
import { countOrphanedImportItems, deleteOrphanedImportItems } from "@/services/imports";

/**
 * Housekeeping routes for the Advanced settings page: report and sweep orphaned records — bookmarks
 * with no category and inbox items whose import has no newsletter.
 */
export async function maintenanceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/maintenance/orphans", {
    schema: {
      tags: ["maintenance"],
    },
  }, async () => {
    const [bookmarks, inboxItems] = await Promise.all([
      countOrphanedBookmarks(),
      countOrphanedImportItems(),
    ]);
    return {
      bookmarks,
      inboxItems,
    };
  });

  app.delete("/api/maintenance/orphan-bookmarks", {
    schema: {
      tags: ["maintenance"],
    },
  }, () => deleteOrphanedBookmarks());

  app.delete("/api/maintenance/orphan-inbox-items", {
    schema: {
      tags: ["maintenance"],
    },
  }, () => deleteOrphanedImportItems());
}
