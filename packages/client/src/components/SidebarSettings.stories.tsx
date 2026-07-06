import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { SidebarSettings } from "./SidebarSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const displayPreferences = {
  bookmarkDetailImageSize: "medium",
  bookmarkDetailVideoSize: "standard",
  bookmarkDetailLayout: "single",
  interfaceLanguage: "en",
  filterLocation: "sidebar",
  filtersInDrawer: false,
  filtersHidden: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
  customPropertyTypeIcons: null,
  onDemandFilters: [],
  minAreaPinThresholdKm2: 0,
  bookmarksPerPage: 25,
  mapPinScale: 1,
};

const automation = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  autoApplyTitleLocations: false,
  sidebarOpenModifier: "alt",
};

const meta = {
  title: "Settings/SidebarSettings",
  component: SidebarSettings,
  parameters: {
    msw: {
      handlers: [
        http.get(
          "/api/app-settings/display-preferences",
          () => HttpResponse.json(displayPreferences),
        ),
        http.get("/api/app-settings/automation", () => HttpResponse.json(automation)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof SidebarSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Drawer pin behaviour and the open-in-drawer modifier key. */
export const Default: Story = {};

/** Drawer pinned by default with the Shift modifier key. */
export const Pinned: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(
          "/api/app-settings/display-preferences",
          () => HttpResponse.json({
            ...displayPreferences,
            panelPinned: true,
          }),
        ),
        http.get("/api/app-settings/automation", () => HttpResponse.json({
          ...automation,
          sidebarOpenModifier: "shift",
        })),
        ...apiHandlers,
      ],
    },
  },
};
