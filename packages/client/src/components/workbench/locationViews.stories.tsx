import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LocationGeneralView } from "./locationViews";
import { makeLocation } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

function node(overrides: Partial<LocationNode>): LocationNode {
  return {
    ...makeLocation(),
    children: [],
    ...overrides,
  };
}

const tokyo = node({
  id: "loc-tokyo",
  name: "Tokyo",
  romanizedName: "Tōkyō",
  slug: "tokyo",
  placeType: "city",
  countryCode: "JP",
  latitude: 35.6762,
  longitude: 139.6503,
  mapUrl: "https://maps.google.com/?q=Tokyo",
  bookmarkCount: 12,
});

const tree: LocationNode[] = [tokyo];

const handlers = [
  http.get("/api/locations/tree", () => HttpResponse.json(tree)),
  ...apiHandlers,
];

const meta = {
  title: "Workbench/LocationGeneralView",
  component: LocationGeneralView,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    entity: tokyo,
  },
} satisfies Meta<typeof LocationGeneralView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The General view tab for a location: metadata grid plus the map section. */
export const Default: Story = {};

/** A bare location with no coordinates, place type, or country. */
export const Minimal: Story = {
  args: {
    entity: node({
      id: "loc-unknown",
      name: "Unknown Place",
      slug: "unknown-place",
    }),
  },
};
