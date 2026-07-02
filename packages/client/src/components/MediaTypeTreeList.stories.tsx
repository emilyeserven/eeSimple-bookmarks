import type { MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { MediaTypeTreeList } from "./MediaTypeTreeList";
import { makeMediaType } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

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
    id: "media-article",
    name: "Article",
    slug: "article",
    builtIn: true,
    sortOrder: 1,
    bookmarkCount: 7,
  }),
];

const meta = {
  title: "Components/MediaTypeTreeList",
  component: MediaTypeTreeList,
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
} satisfies Meta<typeof MediaTypeTreeList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed roots — nested types are hidden until expanded. */
export const Default: Story = {};

/** With "Video" expanded to reveal its child type. */
export const Expanded: Story = {
  args: {
    expanded: new Set<string>(["media-video"]),
  },
};
