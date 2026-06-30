import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LocationsListing } from "./LocationManager";
import { makeLocation } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

function node(overrides: Partial<LocationNode>): LocationNode {
  return {
    ...makeLocation(),
    children: [],
    ...overrides,
  };
}

const tree: LocationNode[] = [
  node({
    id: "loc-japan",
    name: "Japan",
    slug: "japan",
    placeType: "country",
    countryCode: "JP",
    bookmarkCount: 5,
    children: [
      node({
        id: "loc-tokyo",
        name: "Tokyo",
        slug: "tokyo",
        placeType: "city",
        latitude: 35.6762,
        longitude: 139.6503,
        parentId: "loc-japan",
        bookmarkCount: 3,
      }),
    ],
  }),
];

const handlers = [
  ...apiHandlers,
  http.get("/api/locations/tree", () => HttpResponse.json(tree)),
  http.get("/api/app-settings/location-display", () => HttpResponse.json({})),
];

const meta = {
  title: "Components/LocationsListing",
  component: LocationsListing,
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof LocationsListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The full location taxonomy listing: map, sort controls, and the collapsible tree. */
export const Default: Story = {};

/** Empty taxonomy — shows the "No locations yet" message and no map. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/locations/tree", () => HttpResponse.json([])),
        http.get("/api/app-settings/location-display", () => HttpResponse.json({})),
      ],
    },
  },
};
