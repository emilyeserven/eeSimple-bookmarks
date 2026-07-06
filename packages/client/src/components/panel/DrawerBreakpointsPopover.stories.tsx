import type { DisplayPreferenceSettings } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { DrawerBreakpointsPopover } from "./DrawerBreakpointsPopover";

const displayPreferences: DisplayPreferenceSettings = {
  bookmarkDetailImageSize: "medium",
  bookmarkDetailVideoSize: "standard",
  bookmarkDetailLayout: "single",
  interfaceLanguage: "en",
  secondaryLanguageId: null,
  filterLocation: "sidebar",
  filtersInDrawer: false,
  filtersHidden: false,
  panelPinned: true,
  drawerUnpinnedBreakpoints: [640, 768],
  croppedWidth: 16,
  croppedHeight: 9,
  customPropertyTypeIcons: null,
  onDemandFilters: [],
  hanScriptLanguage: "ja",
  minAreaPinThresholdKm2: 0,
  bookmarksPerPage: 25,
  mapPinScale: 1,
  screenshotDefaultDelayMs: 0,
  screenshotDefaultWidth: 1280,
  screenshotDefaultHeight: 720,
  screenshotDefaultScrollDistance: 0,
};

const meta = {
  title: "Components/Panel/DrawerBreakpointsPopover",
  component: DrawerBreakpointsPopover,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/display-preferences", () => HttpResponse.json(displayPreferences)),
      ],
    },
  },
} satisfies Meta<typeof DrawerBreakpointsPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The gear button that opens the unpin-breakpoint checklist popover. */
export const Default: Story = {};
