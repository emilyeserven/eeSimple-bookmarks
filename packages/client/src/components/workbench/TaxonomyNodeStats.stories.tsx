import type { TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TaxonomyNodeStats } from "./TaxonomyNodeStats";
import { makeTag } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";
import { RomanizedLabel } from "../RomanizedLabel";

const parent: TagNode = {
  ...makeTag({
    id: "tag-dev",
    name: "dev",
    slug: "dev",
    romanizedName: null,
  }),
  children: [],
};

const node: TagNode = {
  ...makeTag({
    id: "tag-tools",
    name: "tools",
    slug: "tools",
    parentId: "tag-dev",
    bookmarkCount: 9,
    ownBookmarkCount: 3,
  }),
  children: [
    {
      ...makeTag({
        id: "tag-cli",
        name: "cli",
        slug: "cli",
        parentId: "tag-tools",
      }),
      children: [],
    },
  ],
};

const rootNode: TagNode = {
  ...makeTag({
    id: "tag-root",
    name: "root",
    slug: "root",
    bookmarkCount: 12,
  }),
  children: [],
};

const romanizedParent: TagNode = {
  ...makeTag({
    id: "tag-jp",
    name: "開発",
    slug: "kaihatsu",
    romanizedName: "kaihatsu",
  }),
  children: [],
};

const meta = {
  title: "Components/Workbench/TaxonomyNodeStats",
  component: TaxonomyNodeStats,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    node,
    parent,
  },
} satisfies Meta<typeof TaxonomyNodeStats<TagNode>>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A node with a parent and children, rendering the parent name plainly (Genres & Moods style). */
export const WithParent: Story = {};

/** A root node with no parent and no children. */
export const Root: Story = {
  args: {
    node: rootNode,
    parent: null,
  },
};

/** A custom parent renderer (Tags style: a `RomanizedLabel` with a romanized form). */
export const RomanizedParent: Story = {
  args: {
    parent: romanizedParent,
    renderParent: () => (
      <RomanizedLabel
        name={romanizedParent.name}
        romanized={romanizedParent.romanizedName}
      />
    ),
    autofillClassName: "pt-2",
  },
};
