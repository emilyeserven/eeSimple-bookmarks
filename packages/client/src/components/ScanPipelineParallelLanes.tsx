import type { ScanPipelineParallelLane } from "@eesimple/types";

import { ScanPipelineBranchSwitch } from "./ScanPipelineBranchSwitch";
import { ScanPipelineStageRow } from "./ScanPipelineStageRow";

/**
 * The scan's parallel fan-out: labeled lanes rendered side by side on wide screens, stacked on
 * narrow ones. A lane carrying a branch set (the metadata lane) renders the branch switch and gets
 * the full row width so its side-by-side branches have room.
 */
export function ScanPipelineParallelLanes({
  label, lanes, step,
}: { label: string;
  lanes: ScanPipelineParallelLane[];
  step?: number; }) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <p
        className="
          flex items-center gap-2 text-xs font-medium text-muted-foreground
        "
      >
        {step !== undefined && (
          <span
            className="
              flex size-5 shrink-0 items-center justify-center rounded-full
              bg-muted text-[11px] font-medium tabular-nums
            "
          >
            {step}
          </span>
        )}
        {label}
      </p>
      <div
        className="
          grid gap-3
          md:grid-cols-2
        "
      >
        {lanes.map(lane => (
          <div
            key={lane.id}
            className={`
              space-y-2
              ${lane.branchSet ? "md:col-span-2" : ""}
            `}
          >
            <p className="text-xs font-medium">{lane.label}</p>
            {lane.stages.map(stage => (
              <ScanPipelineStageRow
                key={stage.id}
                stage={stage}
              />
            ))}
            {lane.branchSet && <ScanPipelineBranchSwitch branchSet={lane.branchSet} />}
          </div>
        ))}
      </div>
    </div>
  );
}
