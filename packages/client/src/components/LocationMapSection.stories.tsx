import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationMapSection } from "./LocationMapSection";
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
    id: "loc-tokyo",
    name: "Tokyo",
    slug: "tokyo",
    placeType: "city",
    latitude: 35.6762,
    longitude: 139.6503,
  }),
  node({
    id: "loc-kyoto",
    name: "Kyoto",
    slug: "kyoto",
    placeType: "city",
    latitude: 35.0116,
    longitude: 135.7681,
  }),
];

const meta = {
  title: "Components/LocationMapSection",
  component: LocationMapSection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    mapKey: "listing",
    tree,
  },
} satisfies Meta<typeof LocationMapSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The collapsible "Map" section, open by default, wrapping the location map. */
export const Default: Story = {};

/** With the "Levels" overlay control enabled (listing-page mode). */
export const WithLevels: Story = {
  args: {
    showLevels: true,
  },
};
