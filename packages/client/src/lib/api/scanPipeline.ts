import type { ScanPipelineReport } from "@eesimple/types";

import { request } from "./client";

export const scanPipelineApi = {
  /** The server-authored scan pipeline description, decorated with live gate state (no secrets). */
  getReport: () => request<ScanPipelineReport>("/scan-pipeline"),
};
