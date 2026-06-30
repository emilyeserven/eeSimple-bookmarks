import type { ListSelection } from "../lib/useListSelection";
import type { PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyGroupTable } from "./PropertyGroupTable";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const data: PropertyGroup[] = [
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
  title: "Components/PropertyGroupTable",
  component: PropertyGroupTable,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    data,
    selection: noSelection,
  },
} satisfies Meta<typeof PropertyGroupTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The sortable table view of the property-group listing. */
export const Default: Story = {};

/** Selection mode on — a leading checkbox column appears. */
export const SelectionMode: Story = {
  args: {
    selection: {
      ...noSelection,
      mode: true,
    },
  },
};
