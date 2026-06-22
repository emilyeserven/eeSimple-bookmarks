import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PanelContent } from "./PanelContent";

const panelState: { dCT?: string;
  dCId?: string;
  dMode?: string;
  openType?: () => void; } = {};

vi.mock("./usePanelControls", () => ({
  usePanelControls: () => panelState,
}));

vi.mock("./EntityWorkbenchPanel", () => ({
  EntityWorkbenchPanel: ({
    id, mode,
  }: {
    id: string;
    mode: string;
  }) => <div>workbench:{id}:{mode}</div>,
}));

describe("PanelContent", () => {
  beforeEach(() => {
    panelState.dCT = undefined;
    panelState.dCId = undefined;
    panelState.dMode = undefined;
    panelState.openType = vi.fn();
  });

  it("shows the content-type tiles when no type is selected", () => {
    render(<PanelContent />);
    expect(screen.getByText("Browse")).toBeInTheDocument();
    expect(screen.getByText("Bookmarks")).toBeInTheDocument();
  });

  it("dispatches the autofill editor to the shared workbench panel", () => {
    panelState.dCT = "autofill";
    panelState.dCId = "rule-1";
    panelState.dMode = "edit";
    render(<PanelContent />);
    expect(screen.getByText("workbench:rule-1:edit")).toBeInTheDocument();
  });

  it("dispatches the tag view to the shared workbench panel", () => {
    panelState.dCT = "tag";
    panelState.dCId = "tag-1";
    render(<PanelContent />);
    expect(screen.getByText("workbench:tag-1:view")).toBeInTheDocument();
  });
});
