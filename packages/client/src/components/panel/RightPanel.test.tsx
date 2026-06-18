import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RightPanel } from "./RightPanel";

import { useUiStore } from "@/stores/uiStore";

const controls = {
  isOpen: false,
  close: vi.fn(),
};

vi.mock("./usePanelControls", () => ({
  usePanelControls: () => controls,
}));

vi.mock("./PanelContent", () => ({
  PanelContent: () => <div>panel-body</div>,
}));

let mobile = false;
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => mobile,
}));

vi.mock("@/hooks/useTags", () => ({
  useTagTree: () => ({
    data: undefined,
  }),
}));

vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    data: undefined,
  }),
}));

beforeEach(() => {
  controls.isOpen = false;
  controls.close = vi.fn();
  mobile = false;
  useUiStore.setState({
    panelPinned: false,
  });
});

afterEach(() => {
  useUiStore.setState({
    panelPinned: false,
  });
});

describe("RightPanel", () => {
  it("renders nothing when docked and closed", () => {
    useUiStore.setState({
      panelPinned: true,
    });
    const {
      container,
    } = render(<RightPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a floating drawer when open and unpinned", () => {
    controls.isOpen = true;
    render(<RightPanel />);
    expect(screen.getByText("panel-body")).toBeInTheDocument();
    // Floating mode has no docked close button (the Sheet supplies its own).
    expect(screen.queryByLabelText("Close panel")).not.toBeInTheDocument();
  });

  it("renders a docked column with a close button when open and pinned on desktop", () => {
    controls.isOpen = true;
    useUiStore.setState({
      panelPinned: true,
    });
    render(<RightPanel />);
    expect(screen.getByText("panel-body")).toBeInTheDocument();
    expect(screen.getByLabelText("Close panel")).toBeInTheDocument();
  });

  it("stays floating on mobile even when pinned", () => {
    controls.isOpen = true;
    mobile = true;
    useUiStore.setState({
      panelPinned: true,
    });
    render(<RightPanel />);
    expect(screen.getByText("panel-body")).toBeInTheDocument();
    expect(screen.queryByLabelText("Close panel")).not.toBeInTheDocument();
  });

  it("toggles the pinned preference from the pin button", () => {
    controls.isOpen = true;
    render(<RightPanel />);
    fireEvent.click(screen.getByLabelText("Pin panel"));
    expect(useUiStore.getState().panelPinned).toBe(true);
  });

  it("clears the panel from the docked close button", () => {
    controls.isOpen = true;
    useUiStore.setState({
      panelPinned: true,
    });
    render(<RightPanel />);
    fireEvent.click(screen.getByLabelText("Close panel"));
    expect(controls.close).toHaveBeenCalled();
  });
});
