import type { ListSelection } from "../lib/useListSelection";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyGroupTable } from "./PropertyGroupTable";
import { makePropertyGroup } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const data = [
  makePropertyGroup({
    id: "group-reading",
    name: "Reading",
    slug: "reading",
    description: "Progress-tracking properties.",
    priority: 0,
    propertyCount: 3,
  }),
  makePropertyGroup({
    id: "group-ratings",
    name: "Ratings",
    slug: "ratings",
    description: null,
    priority: 1,
    propertyCount: 1,
  }),
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
