import type { ListSelection } from "../lib/useListSelection";
import type { PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyGroupListBody } from "./PropertyGroupListBody";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const groups: PropertyGroup[] = [
  {
    id: "group-reading",
    name: "Reading",
    slug: "reading",
    description: "Progress-tracking properties.",
    priority: 0,
    createdAt: NOW,
    propertyCount: 3,
  },
  {
    id: "group-ratings",
    name: "Ratings",
    slug: "ratings",
    description: null,
    priority: 1,
    createdAt: NOW,
    propertyCount: 1,
  },
];

const noSelection: ListSelection = {
  selectedIds: [],
  selectedSet: new Set<string>(),
  isSelected: () => false,
  toggle: () => {},
  selectAll: () => {},
  clear: () => {},
  count: 0,
  allSelected: false,
  mode: false,
  setMode: () => {},
};

const meta = {
  title: "Components/PropertyGroupListBody",
  component: PropertyGroupListBody,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    groups,
    selection: noSelection,
  },
} satisfies Meta<typeof PropertyGroupListBody>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The listing body — renders as a card grid or table per the active view mode. */
export const Default: Story = {};

/** No groups — the body renders nothing. */
export const Empty: Story = {
  args: {
    groups: [],
  },
};
