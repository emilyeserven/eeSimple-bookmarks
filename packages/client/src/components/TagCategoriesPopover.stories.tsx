import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";

import { TagCategoriesPopover } from "./TagCategoriesPopover";
import { apiHandlers } from "../test-utils/story-mocks";

const scopedHandlers = [
  ...apiHandlers,
  http.get("/api/tags/:id/categories", () => HttpResponse.json({
    categoryIds: ["cat-workflow", "cat-content"],
  })),
];

const allHandlers = [
  ...apiHandlers,
  http.get("/api/tags/:id/categories", () => HttpResponse.json({
    categoryIds: [],
  })),
];

const meta = {
  title: "Tags/TagCategoriesPopover",
  component: TagCategoriesPopover,
  args: {
    tagId: "tag-dev",
    tagName: "dev",
  },
} satisfies Meta<typeof TagCategoriesPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Folder trigger — click to reveal the categories this tag is scoped to. */
export const ScopedToCategories: Story = {
  parameters: {
    msw: {
      handlers: scopedHandlers,
    },
  },
};

/** A tag offered in every category shows "All categories". */
export const AllCategories: Story = {
  parameters: {
    msw: {
      handlers: allHandlers,
    },
  },
};
