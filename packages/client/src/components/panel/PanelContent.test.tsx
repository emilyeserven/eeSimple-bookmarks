import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PanelContent } from "./PanelContent";

const panelState: { dCT?: string;
  dCId?: string; } = {};

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
  });

  it("renders nothing when the params are absent", () => {
    const {
      container,
    } = render(<PanelContent />);
    expect(container).toBeEmptyDOMElement();
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
