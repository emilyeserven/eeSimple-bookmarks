import type { ListSelection } from "../lib/useListSelection";
import type { MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { MediaTypeTable } from "./MediaTypeTable";
import { makeMediaType } from "../test-utils/factories";

function node(overrides: Partial<MediaTypeNode>, children: MediaTypeNode[] = []): MediaTypeNode {
  return {
    ...makeMediaType(),
    children,
    ...overrides,
  };
}

const tree: MediaTypeNode[] = [
  node({
    id: "media-video",
    name: "Video",
    slug: "video",
    builtIn: true,
    sortOrder: 0,
    bookmarkCount: 4,
  }, [
    node({
      id: "media-short",
      name: "Short",
      slug: "short",
      parentId: "media-video",
      bookmarkCount: 1,
    }),
  ]),
  node({
    id: "media-podcast",
    name: "Podcast",
    slug: "podcast",
    sortOrder: 2,
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
  title: "Components/MediaTypeTable",
  component: MediaTypeTable,
  args: {
    tree,
    selection: noSelection,
  },
} satisfies Meta<typeof MediaTypeTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The media-type table (selection mode off). */
export const Default: Story = {};

/** Selection mode on — a leading checkbox column appears (built-ins are not selectable). */
export const SelectionMode: Story = {
  args: {
    selection: {
      ...noSelection,
      mode: true,
    },
  },
};
