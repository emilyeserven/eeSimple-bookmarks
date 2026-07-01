import type { DisplayPreferenceSettings } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RightPanel } from "./RightPanel";

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

let viewportWidth = 1024;
vi.mock("@/hooks/use-mobile", () => ({
  useViewportWidth: () => viewportWidth,
}));

vi.mock("@/hooks/useTags", () => ({
  useTagTree: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useWebsites", () => ({
  useWebsites: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useMediaTypes", () => ({
  useMediaTypeTree: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useYouTubeChannels", () => ({
  useYouTubeChannels: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/usePropertyGroups", () => ({
  usePropertyGroups: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useAutofill", () => ({
  useAutofillRules: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

// The display preferences (panel pin + breakpoints) are now server-backed; mock the hooks so the
// test can drive `panelPinned` directly and assert the save mutation fires on the pin toggle.
let panelPinned = false;
let drawerUnpinnedBreakpoints = [768];
const updateMutate = vi.fn();

function displayData(): DisplayPreferenceSettings {
  return {
    bookmarkDetailImageSize: "medium",
    bookmarkDetailVideoSize: "standard",
    bookmarkDetailLayout: "single",
    filtersInDrawer: false,
    filtersHidden: false,
    panelPinned,
    drawerUnpinnedBreakpoints,
    croppedWidth: 16,
    croppedHeight: 9,
    customPropertyTypeIcons: null,
    onDemandFilters: [],
    showRomanizedByDefault: false,
    sortByRomanized: true,
    showLocationAncestorsOnMap: false,
    minAreaPinThresholdKm2: 0,
    bookmarksPerPage: 25,
  };
}

vi.mock("@/hooks/useAppSettings", () => ({
  usePanelPinned: () => panelPinned,
  useDrawerUnpinnedBreakpoints: () => drawerUnpinnedBreakpoints,
  useDisplayPreferenceSettings: () => ({
    data: displayData(),
  }),
  useUpdateDisplayPreferenceSettings: () => ({
    mutate: updateMutate,
  }),
}));

beforeEach(() => {
  controls.isOpen = false;
  controls.close = vi.fn();
  viewportWidth = 1024;
  panelPinned = false;
  drawerUnpinnedBreakpoints = [768];
  updateMutate.mockClear();
});

afterEach(() => {
  panelPinned = false;
  drawerUnpinnedBreakpoints = [768];
});

describe("RightPanel", () => {
  it("renders nothing when docked and closed", () => {
    panelPinned = true;
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
    panelPinned = true;
    render(<RightPanel />);
    expect(screen.getByText("panel-body")).toBeInTheDocument();
    expect(screen.getByLabelText("Close panel")).toBeInTheDocument();
  });

  it("stays floating on mobile even when pinned", () => {
    controls.isOpen = true;
    viewportWidth = 500; // below the 768 breakpoint in drawerUnpinnedBreakpoints
    panelPinned = true;
    render(<RightPanel />);
    expect(screen.getByText("panel-body")).toBeInTheDocument();
    expect(screen.queryByLabelText("Close panel")).not.toBeInTheDocument();
  });

  it("toggles the pinned preference from the pin button", () => {
    controls.isOpen = true;
    render(<RightPanel />);
    fireEvent.click(screen.getByLabelText("Pin panel"));
    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        panelPinned: true,
      }),
      expect.anything(),
    );
  });

  it("clears the panel from the docked close button", () => {
    controls.isOpen = true;
    panelPinned = true;
    render(<RightPanel />);
    fireEvent.click(screen.getByLabelText("Close panel"));
    expect(controls.close).toHaveBeenCalled();
  });
});
