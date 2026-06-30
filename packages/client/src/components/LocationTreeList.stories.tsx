import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationTreeList } from "./LocationTreeList";
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
    node({
      id: "loc-kyoto",
      name: "Kyoto",
      slug: "kyoto",
      parentId: "loc-japan",
      bookmarkCount: 2,
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
  title: "Components/LocationTreeList",
  component: LocationTreeList,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree,
    expanded: new Set<string>(),
    onToggle: () => {},
    columns: 2,
  },
} satisfies Meta<typeof LocationTreeList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed roots — only top-level locations are shown. */
export const Default: Story = {};

/** With "Japan" expanded to reveal its children. */
export const Expanded: Story = {
  args: {
    expanded: new Set<string>(["loc-japan"]),
  },
};
