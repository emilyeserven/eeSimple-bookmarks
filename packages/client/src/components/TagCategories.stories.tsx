import type { TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { TagCategories } from "./TagCategories";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

const rootTag: TagNode = sampleTagTree[0];
const childTag: TagNode = sampleTagTree[0].children[0];

const handlers = [
  ...apiHandlers,
  http.get("/api/tags/:id/categories", () => HttpResponse.json({
    categoryIds: ["cat-workflow"],
  })),
];

const meta = {
  title: "Tags/TagCategories",
  component: TagCategories,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    tag: rootTag,
  },
} satisfies Meta<typeof TagCategories>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A root tag: pick which categories offer it. */
export const RootTag: Story = {};

/** A child tag: scoping is unavailable (only root tags can be scoped). */
export const ChildTag: Story = {
  args: {
    tag: childTag,
  },
};
