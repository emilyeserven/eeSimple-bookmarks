import type { PlaceTypeLevelGroupConfig } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LocationLevelsOverlay } from "./LocationLevelsOverlay";

const groups: PlaceTypeLevelGroupConfig = [
  {
    id: "level-country",
    name: "Country",
    placeTypes: ["country"],
    displayMode: "area",
    visible: true,
    sortOrder: 0,
    color: "#2563eb",
  },
  {
    id: "level-city",
    name: "City",
    placeTypes: ["city", "town"],
    displayMode: "pin",
    visible: false,
    sortOrder: 1,
    color: "#e11d48",
  },
];

const handlers = [
  http.get("/api/app-settings/location-level-groups", () => HttpResponse.json(groups)),
  http.get("/api/locations", () => HttpResponse.json([])),
];

const meta = {
  title: "Components/LocationLevelsOverlay",
  component: LocationLevelsOverlay,
  args: {
    controls: {
      visibleIds: new Set(["level-country"]),
      onToggleVisible: () => {},
      disabledIds: new Set<string>(),
      levelMode: "current",
      onLevelModeChange: () => {},
      hideAdminBorders: false,
      onHideAdminBordersChange: () => {},
    },
  },
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof LocationLevelsOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The "Levels" trigger button; opening it reveals the per-group visibility + pin/area controls. */
export const Default: Story = {};

/** No level groups defined yet — the popover shows the empty hint. */
export const NoGroups: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/location-level-groups", () => HttpResponse.json([])),
        http.get("/api/locations", () => HttpResponse.json([])),
      ],
    },
  },
};
