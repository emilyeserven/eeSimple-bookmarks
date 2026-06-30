import type { FastifyInstance } from "fastify";
import { getReelArchiveJob, listActiveReelArchiveJobs } from "@/services/reelArchive";

/**
 * Reel-archive job status, mounted under `/api`. Mirrors `GET /api/imports/active`: the header
 * progress indicator polls the active list while any capture is in flight, and resolves each job's
 * final outcome via `/:id` once it leaves the active set (to fire a completion toast). The per-job
 * enqueue lives on the bookmark route (`POST /api/bookmarks/:id/reel-archive`).
 */
export async function reelArchiveRoutes(app: FastifyInstance): Promise<void> {
  // List the reel-archive jobs currently in flight (queued/processing) — polled by the header.
  app.get("/api/reel-archive/active", {
    schema: {
      tags: ["images"],
    },
  }, () => listActiveReelArchiveJobs());

  // One reel-archive job's full record, used to resolve a completion toast.
  app.get("/api/reel-archive/:id", {
    schema: {
      tags: ["images"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
        },
      },
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const job = await getReelArchiveJob(id);
    if (!job) return reply.code(404).send({
      message: "Reel archive job not found",
    });
    return job;
  });
}
