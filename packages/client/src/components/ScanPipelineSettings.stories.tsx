import type { ScanPipelineGateLive, ScanPipelineReport, ScanPipelineStage } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ScanPipelineSettings } from "./ScanPipelineSettings";
import { makeScanPipelineReport } from "../test-utils/factories";

/** Flip every off gate to on — the "everything configured" fixture variant. */
function flipLiveOn(live: ScanPipelineGateLive | undefined): ScanPipelineGateLive | undefined {
  if (live?.state !== "off") return live;
  return {
    state: "on",
    detail: "Connector configured.",
  };
}

function flipStageOn(stage: ScanPipelineStage): void {
  stage.live = flipLiveOn(stage.live);
  for (const precedence of stage.precedences ?? []) {
    for (const source of precedence.sources) source.live = flipLiveOn(source.live);
  }
}

function allGatesOnReport(): ScanPipelineReport {
  const report = makeScanPipelineReport({
    cache: {
      entries: 12,
      maxEntries: 500,
      ttlMs: 60_000,
    },
  });
  for (const node of report.description.nodes) {
    if (node.kind === "stage") flipStageOn(node.stage);
    if (node.kind === "parallel") {
      for (const lane of node.lanes) {
        lane.stages.forEach(flipStageOn);
        for (const branch of lane.branchSet?.branches ?? []) branch.stages.forEach(flipStageOn);
      }
    }
    if (node.kind === "branch") {
      for (const branch of node.branchSet.branches) branch.stages.forEach(flipStageOn);
    }
  }
  return report;
}

function handlersFor(report: ScanPipelineReport) {
  return [http.get("/api/scan-pipeline", () => HttpResponse.json(report))];
}

const meta = {
  title: "Components/ScanPipelineSettings",
  component: ScanPipelineSettings,
} satisfies Meta<typeof ScanPipelineSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Fresh deploy: optional connectors unconfigured, no website opted into ISBN scanning. */
export const ConnectorsOff: Story = {
  parameters: {
    msw: {
      handlers: handlersFor(makeScanPipelineReport()),
    },
  },
};

/** Everything configured: every gate active, a warm cache. */
export const ConnectorsOn: Story = {
  parameters: {
    msw: {
      handlers: handlersFor(allGatesOnReport()),
    },
  },
};
