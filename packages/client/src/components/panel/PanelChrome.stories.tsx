import type { DisplayPreferenceSettings } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PanelChrome } from "./PanelChrome";

const displayPreferences: DisplayPreferenceSettings = {
  bookmarkDetailImageSize: "medium",
  bookmarkDetailVideoSize: "standard",
  bookmarkDetailLayout: "single",
  filtersInDrawer: false,
  filtersHidden: false,
  panelPinned: true,
  drawerUnpinnedBreakpoints: [640],
  croppedWidth: 16,
  croppedHeight: 9,
  customPropertyTypeIcons: null,
  onDemandFilters: [],
  showRomanizedByDefault: false,
  sortByRomanized: false,
  showLocationAncestorsOnMap: false,
  bookmarksPerPage: 25,
};

const meta = {
  title: "Components/Panel/PanelChrome",
  component: PanelChrome,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/display-preferences", () => HttpResponse.json(displayPreferences)),
      ],
    },
  },
  decorators: [
    Story => (
      <div className="w-96 border">
        <Story />
      </div>
    ),
  ],
  args: {
    docked: true,
    isBreakpointUnpinned: false,
  },
} satisfies Meta<typeof PanelChrome>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Docked: pin toggle (with breakpoint gear) on the left, a close button on the right. */
export const Docked: Story = {};

/** Floating overlay (not docked): no close button. */
export const Floating: Story = {
  args: {
    docked: false,
  },
};

/** Below an unpin breakpoint — the pin controls are hidden. */
export const BreakpointUnpinned: Story = {
  args: {
    isBreakpointUnpinned: true,
  },
};
