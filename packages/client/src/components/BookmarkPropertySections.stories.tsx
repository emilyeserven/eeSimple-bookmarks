import type { PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkPropertySections } from "./BookmarkPropertySections";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

const propertyGroups: PropertyGroup[] = [
  {
    id: "group-workflow",
    name: "Workflow",
    slug: "workflow",
    description: null,
    priority: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
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
