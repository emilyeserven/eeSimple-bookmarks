import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkPropertySections } from "./BookmarkPropertySections";
import { makePropertyGroup } from "../test-utils/factories";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

const propertyGroups = [
  makePropertyGroup({
    id: "group-workflow",
    name: "Workflow",
    slug: "workflow",
    description: null,
  }),
];

const meta = {
  title: "Bookmarks/BookmarkPropertySections",
  component: BookmarkPropertySections,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
    properties: sampleProperties,
    propertyGroups,
  },
} satisfies Meta<typeof BookmarkPropertySections>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoGroups: Story = {
  args: {
    propertyGroups: [],
  },
};
