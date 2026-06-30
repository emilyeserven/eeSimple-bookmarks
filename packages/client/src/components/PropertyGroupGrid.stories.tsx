import type { ListSelection } from "../lib/useListSelection";
import type { PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyGroupGrid } from "./PropertyGroupGrid";
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
    propertyCount: 0,
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
  title: "Components/PropertyGroupGrid",
  component: PropertyGroupGrid,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    groups,
    selection: noSelection,
  },
} satisfies Meta<typeof PropertyGroupGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The card-grid view of the property-group listing. */
export const Default: Story = {};
