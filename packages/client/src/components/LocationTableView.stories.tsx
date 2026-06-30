import type { ListSelection } from "../lib/useListSelection";
import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationTableView } from "./LocationTableView";
import { makeLocation } from "../test-utils/factories";

function node(overrides: Partial<LocationNode>, children: LocationNode[] = []): LocationNode {
  return {
    ...makeLocation(),
    children,
    ...overrides,
  };
}

const sortedTree: LocationNode[] = [
  node({
    id: "loc-japan",
    name: "Japan",
    slug: "japan",
    placeType: "country",
    bookmarkCount: 9,
  }, [
    node({
      id: "loc-tokyo",
      name: "Tokyo",
      slug: "tokyo",
      placeType: "city",
      parentId: "loc-japan",
      bookmarkCount: 4,
    }),
  ]),
  node({
    id: "loc-france",
    name: "France",
    slug: "france",
    placeType: "country",
    bookmarkCount: 3,
  }),
];

/** A selection controller with selection mode off → no leading checkbox column. */
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
  title: "Components/LocationTableView",
  component: LocationTableView,
  args: {
    sortedTree,
    selection: noSelection,
  },
} satisfies Meta<typeof LocationTableView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The locations table (selection mode off). */
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
