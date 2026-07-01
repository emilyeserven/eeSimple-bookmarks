import type { MapDebugInfo } from "../lib/locationMapDebug";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationMapDebugModal } from "./LocationMapDebugModal";

const debug: MapDebugInfo = {
  props: {
    className: "h-[70vh] w-full rounded-lg border",
    hideAdminBorders: false,
    displayConfig: {
      city: {
        visible: true,
        displayMode: "pin",
        sortOrder: 1,
      },
      region: {
        visible: true,
        displayMode: "area",
        sortOrder: 0,
      },
    },
    iconConfig: {},
    colorConfig: {
      city: "#2563eb",
    },
  },
  settings: {
    minAreaKm2: 5,
    pinScale: 1,
  },
  viewport: {
    seededFromPreviousView: true,
    center: [35.68, 139.76],
    zoom: 6,
  },
  summary: {
    totalNodes: 4,
    withCoordinates: 3,
    withBoundary: 2,
    rendered: 2,
    renderedAreas: 1,
    renderedPins: 1,
    omittedNoGeometry: 1,
    hiddenByLevel: 1,
    noPlaceType: 1,
    noLevel: 0,
  },
  layers: {
    scopeKind: "location",
    levelMode: "current",
    hideAdminBorders: false,
    filterIds: [],
    onlyDirectRelatives: false,
    groups: [
      {
        id: "country",
        name: "Country",
        sortOrder: 0,
        displayMode: "area",
        color: "#94a3b8",
        placeTypes: ["country"],
        visible: false,
        disabled: true,
        populated: false,
      },
      {
        id: "city",
        name: "City",
        sortOrder: 1,
        displayMode: "pin",
        color: "#2563eb",
        placeTypes: ["city", "town"],
        visible: true,
        disabled: false,
        populated: true,
      },
    ],
  },
  nodes: [
    {
      id: "tokyo",
      name: "Tokyo",
      slug: "tokyo",
      depth: 0,
      placeType: "city",
      placeTypeKey: "city",
      latitude: 35.68,
      longitude: 139.76,
      hasCoordinates: true,
      hasBoundary: false,
      boundaryType: null,
      boundaryAreaKm2: null,
      rendered: true,
      hiddenReason: null,
      renderKind: "pin",
      color: "#2563eb",
      colorReason: null,
      icon: null,
    },
    {
      id: "mystery",
      name: "Mystery Place",
      slug: "mystery-place",
      depth: 1,
      placeType: null,
      placeTypeKey: "",
      latitude: null,
      longitude: null,
      hasCoordinates: false,
      hasBoundary: false,
      boundaryType: null,
      boundaryAreaKm2: null,
      rendered: false,
      hiddenReason: "no-geometry",
      renderKind: null,
      color: null,
      colorReason: null,
      icon: null,
    },
  ],
};

const meta = {
  title: "Components/LocationMapDebugModal",
  component: LocationMapDebugModal,
  args: {
    debug,
  },
} satisfies Meta<typeof LocationMapDebugModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The trigger button; click "Debug" to open the copy/paste-ready dump. */
export const Default: Story = {};
