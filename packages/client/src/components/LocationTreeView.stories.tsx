import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationTreeView } from "./LocationTreeView";
import { makeLocation } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

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
    bookmarkCount: 9,
  }, [
    node({
      id: "loc-tokyo",
      name: "Tokyo",
      slug: "tokyo",
      parentId: "loc-japan",
      bookmarkCount: 4,
    }),
  ]),
  node({
    id: "loc-france",
    name: "France",
    slug: "france",
    bookmarkCount: 3,
  }),
];

const meta = {
  title: "Components/LocationTreeView",
  component: LocationTreeView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree,
    sortedTree: tree,
    expanded: new Set<string>(),
    onToggle: () => {},
    onExpandAll: () => {},
    onCollapseAll: () => {},
  },
} satisfies Meta<typeof LocationTreeView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The tree view with its expand-all toggle over the indented list. */
export const Default: Story = {};

/** With "Japan" expanded. */
export const Expanded: Story = {
  args: {
    expanded: new Set<string>(["loc-japan"]),
  },
};
