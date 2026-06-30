import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationMap } from "./LocationMap";
import { makeLocation } from "../test-utils/factories";

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
  node({
    id: "loc-osaka",
    name: "Osaka",
    slug: "osaka",
    placeType: "city",
    latitude: 34.6937,
    longitude: 135.5023,
  }),
];

const meta = {
  title: "Components/LocationMap",
  component: LocationMap,
  args: {
    tree,
  },
} satisfies Meta<typeof LocationMap>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A handful of placed locations rendered as pins on the map. */
export const Default: Story = {};

/** No location has coordinates yet — the empty-state message is shown instead of a map. */
export const Empty: Story = {
  args: {
    tree: [
      node({
        id: "loc-nowhere",
        name: "Unplaced",
        slug: "unplaced",
      }),
    ],
  },
};
