import type { FastifyInstance } from "fastify";
import type { ScanPipelineReport } from "@eesimple/types";
import { buildScanPipelineReport, collectScanPipelineLiveState } from "@/services/scanPipeline";
import { SCAN_PIPELINE_DESCRIPTION } from "@/services/scanPipelineDescription";

/**
 * Scan-pipeline description, mounted under `/api`. Serves the static pipeline descriptor decorated
 * with live gate state for the Settings → Advanced → Scan Pipeline page. Strictly read-only and
 * carries no secrets — connector gates are booleans only (base URLs stay on `GET /api/connectors`),
 * plus counts and cache stats — so it's safe over the unauthenticated API.
 */
export async function scanPipelineRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/scan-pipeline", {
    schema: {
      tags: ["scan-pipeline"],
    },
  }, async (): Promise<ScanPipelineReport> =>
    buildScanPipelineReport(SCAN_PIPELINE_DESCRIPTION, await collectScanPipelineLiveState()));
}
