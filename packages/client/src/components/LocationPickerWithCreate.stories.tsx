import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationPickerWithCreate } from "./LocationPickerWithCreate";
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
  }),
  node({
    id: "loc-kyoto",
    name: "Kyoto",
    slug: "kyoto",
  }),
];

const meta = {
  title: "Components/LocationPickerWithCreate",
  component: LocationPickerWithCreate,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree,
    selectedIds: [],
    onToggle: () => {},
  },
} satisfies Meta<typeof LocationPickerWithCreate>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The picker with a built-in "Create location" option that opens the Add Location modal. */
export const Default: Story = {};

/** With a location already selected. */
export const WithSelection: Story = {
  args: {
    selectedIds: ["loc-tokyo"],
  },
};
