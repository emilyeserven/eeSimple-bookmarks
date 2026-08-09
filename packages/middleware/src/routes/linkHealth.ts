import type { FastifyInstance } from "fastify";
import type { BrokenBookmark, LinkRecheckResult } from "@eesimple/types";
import { getLinkCheckJobStatus, setLinkCheckJobStatus } from "@/services/linkCheckState";
import { bulkCheckBookmarkLinks, listBrokenBookmarks, recheckBookmarkLink } from "@/services/linkHealth";
import { AppError } from "@/utils/errors";

const bookmarkParams = {
  type: "object",
  required: ["bookmarkId"],
  properties: {
    bookmarkId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/**
 * Link Health routes for the Advanced settings page: an on-demand dead-link batch check (202 +
 * fire-and-forget + status polling, mirroring the gallery auto-fetch job), the broken-bookmarks
 * listing, and a single-bookmark re-check.
 */
export async function linkHealthRoutes(app: FastifyInstance): Promise<void> {
  // Bulk link check: start a background job and return immediately.
  // A second POST while a job is running returns 409.
  app.post("/api/link-health/check", {
    schema: {
      tags: ["maintenance"],
    },
  }, async (_req, reply) => {
    if (getLinkCheckJobStatus().status === "running") {
      throw new AppError("A link check is already in progress", "conflict", 409);
    }

    // Kick off the job in the background without awaiting.
    setLinkCheckJobStatus({
      status: "running",
      totalCount: 0,
      processedCount: 0,
    });
    void bulkCheckBookmarkLinks((processed, total) => {
      setLinkCheckJobStatus({
        status: "running",
        totalCount: total,
        processedCount: processed,
      });
    }).then((result) => {
      setLinkCheckJobStatus({
        status: "done",
        ...result,
      });
    }).catch(() => {
      setLinkCheckJobStatus({
        status: "idle",
      });
    });

    return reply.code(202).send(getLinkCheckJobStatus());
  });

  // Return the current status of the background link-check job.
  app.get("/api/link-health/check/status", {
    schema: {
      tags: ["maintenance"],
    },
  }, async () => getLinkCheckJobStatus());

  // Every bookmark whose last link check failed.
  app.get("/api/link-health/broken", {
    schema: {
      tags: ["maintenance"],
    },
  }, async (): Promise<BrokenBookmark[]> => listBrokenBookmarks());

  // Re-check a single bookmark's link on demand.
  app.post("/api/link-health/bookmarks/:bookmarkId/check", {
    schema: {
      tags: ["maintenance"],
      params: bookmarkParams,
    },
  }, async (req): Promise<LinkRecheckResult> => {
    const {
      bookmarkId,
    } = req.params as { bookmarkId: string };
    return recheckBookmarkLink(bookmarkId);
  });
}
