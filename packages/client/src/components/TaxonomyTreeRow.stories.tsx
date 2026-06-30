import type { TaxonomyTreeNode } from "./TaxonomyTreeRow";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Info, Pencil } from "lucide-react";

import { TaxonomyTreeList } from "./TaxonomyTreeRow";

const tree: TaxonomyTreeNode[] = [
  {
    id: "media-video",
    name: "Video",
    slug: "video",
    icon: "Video",
    builtIn: true,
    bookmarkCount: 12,
    ownBookmarkCount: 4,
    children: [
      {
        id: "media-shorts",
        name: "Shorts",
        slug: "shorts",
        bookmarkCount: 8,
        ownBookmarkCount: 8,
        children: [],
      },
    ],
  },
  {
    id: "media-article",
    name: "Article",
    slug: "article",
    bookmarkCount: 0,
    ownBookmarkCount: 0,
    children: [],
  },
];

const meta = {
  title: "Components/TaxonomyTreeList",
  component: TaxonomyTreeList,
  args: {
    tree,
    expanded: new Set<string>(),
    onToggle: () => {},
    columns: 1,
    renderNameLink: node => <span className="flex-1 truncate">{node.name}</span>,
    renderEditLink: node => (
      <a aria-label={`Edit ${node.name}`}>
        <Pencil className="size-4" />
      </a>
    ),
    renderInfoLink: node => (
      <a aria-label={`View ${node.name}`}>
        <Info className="size-4" />
      </a>
    ),
  },
} satisfies Meta<typeof TaxonomyTreeList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed roots; a zero-count node (Article) is de-emphasized, a built-in node carries a badge. */
export const Default: Story = {};

/** Expanded to reveal child rows. */
export const Expanded: Story = {
  args: {
    expanded: new Set(["media-video"]),
  },
};
