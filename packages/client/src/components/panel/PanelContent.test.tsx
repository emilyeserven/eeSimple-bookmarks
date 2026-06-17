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

vi.mock("./AutofillRulePanel", () => ({
  AutofillRulePanel: ({
    ruleId,
  }: {
    ruleId: string;
  }) => <div>autofill:{ruleId}</div>,
}));

vi.mock("./TagPanel", () => ({
  TagPanel: ({
    tagId,
  }: {
    tagId: string;
  }) => <div>tag:{tagId}</div>,
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

  it("dispatches to the autofill editor", () => {
    panelState.dCT = "autofill";
    panelState.dCId = "rule-1";
    render(<PanelContent />);
    expect(screen.getByText("autofill:rule-1")).toBeInTheDocument();
  });

  it("dispatches to the tag editor", () => {
    panelState.dCT = "tag";
    panelState.dCId = "tag-1";
    render(<PanelContent />);
    expect(screen.getByText("tag:tag-1")).toBeInTheDocument();
  });
});
