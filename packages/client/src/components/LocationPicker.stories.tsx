import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationPicker } from "./LocationPicker";
import { makeLocation } from "../test-utils/factories";

function node(overrides: Partial<LocationNode>, children: LocationNode[] = []): LocationNode {
  return {
    ...makeLocation(),
    children,
    ...overrides,
  };
}

const tree: LocationNode[] = [
  node({
    id: "loc-japan",
    name: "Japan",
    slug: "japan",
  }, [
    node({
      id: "loc-tokyo",
      name: "Tokyo",
      slug: "tokyo",
      parentId: "loc-japan",
    }),
    node({
      id: "loc-kyoto",
      name: "Kyoto",
      slug: "kyoto",
      parentId: "loc-japan",
    }),
  ]),
  node({
    id: "loc-france",
    name: "France",
    slug: "france",
  }, [
    node({
      id: "loc-paris",
      name: "Paris",
      slug: "paris",
      parentId: "loc-france",
    }),
  ]),
];

const meta = {
  title: "Components/LocationPicker",
  component: LocationPicker,
  args: {
    tree,
    selectedIds: [],
    onToggle: () => {},
  },
} satisfies Meta<typeof LocationPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Empty picker with the full location tree available to select. */
export const Default: Story = {};

/** Picker with a couple of locations already selected. */
export const WithSelection: Story = {
  args: {
    selectedIds: ["loc-tokyo", "loc-paris"],
  },
};
