import { useQuery } from "@tanstack/react-query";

import { scanPipelineApi } from "../lib/api/scanPipeline";

const SCAN_PIPELINE_KEY = ["scan-pipeline"] as const;

/** The live-decorated scan pipeline description, for the Settings → Advanced → Scan Pipeline page. */
export function useScanPipeline() {
  return useQuery({
    queryKey: SCAN_PIPELINE_KEY,
    queryFn: scanPipelineApi.getReport,
  });
}
