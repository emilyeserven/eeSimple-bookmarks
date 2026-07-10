import type { ScanPipelineBranchSet } from "@eesimple/types";

import { Split } from "lucide-react";

import { ScanPipelineStageRow } from "./ScanPipelineStageRow";

/**
 * An either/or fork in the scan pipeline (the YouTube vs generic metadata branch): the chooser
 * condition over the alternative branches side by side. Branch text is server-authored data.
 */
export function ScanPipelineBranchSwitch({
  branchSet,
}: { branchSet: ScanPipelineBranchSet }) {
  return (
    <div className="space-y-2">
      <p
        className="
          flex items-center gap-1.5 text-xs font-medium text-muted-foreground
        "
      >
        <Split className="size-3.5 shrink-0" />
        {branchSet.chooser}
      </p>
      <div
        className="
          grid gap-2
          lg:grid-cols-2
        "
      >
        {branchSet.branches.map(branch => (
          <div
            key={branch.id}
            className="space-y-2 rounded-md border border-dashed p-2"
          >
            <p className="text-xs font-medium">{branch.label}</p>
            {branch.stages.map(stage => (
              <ScanPipelineStageRow
                key={stage.id}
                stage={stage}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
