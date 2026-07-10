import type { ScanPipelineNode } from "@eesimple/types";

import { ScanPipelineBranchSwitch } from "./ScanPipelineBranchSwitch";
import { ScanPipelineParallelLanes } from "./ScanPipelineParallelLanes";
import { ScanPipelineStageRow } from "./ScanPipelineStageRow";

function nodeKey(node: ScanPipelineNode): string {
  switch (node.kind) {
    case "stage":
      return node.stage.id;
    case "parallel":
      return node.id;
    case "branch":
      return node.branchSet.id;
  }
}

function renderNode(node: ScanPipelineNode, step: number) {
  switch (node.kind) {
    case "stage":
      return (
        <ScanPipelineStageRow
          stage={node.stage}
          step={step}
        />
      );
    case "parallel":
      return (
        <ScanPipelineParallelLanes
          label={node.label}
          lanes={node.lanes}
          step={step}
        />
      );
    case "branch":
      return <ScanPipelineBranchSwitch branchSet={node.branchSet} />;
  }
}

/**
 * The ordered scan-pipeline node list: numbered top-level steps connected by a short vertical rule,
 * dispatching each node to its stage row / parallel lanes / branch switch renderer.
 */
export function ScanPipelineNodeList({
  nodes,
}: { nodes: ScanPipelineNode[] }) {
  return (
    <div>
      {nodes.map((node, index) => (
        <div key={nodeKey(node)}>
          {index > 0 && <div className="ml-5 h-3 w-px bg-border" />}
          {renderNode(node, index + 1)}
        </div>
      ))}
    </div>
  );
}
