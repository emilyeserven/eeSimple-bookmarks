import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCardDetails } from "./BookmarkCardDetails";
import { fieldPlacementsForCard } from "../lib/bookmarkCardValues";
import {
  apiHandlers,
  sampleBookmark,
  sampleCategories,
  sampleProperties,
} from "../test-utils/story-mocks";

const placements = fieldPlacementsForCard(undefined, sampleProperties);
const workflowCategory = sampleCategories.find(c => c.id === "cat-workflow");

const meta = {
  title: "Components/BookmarkCardDetails",
  component: BookmarkCardDetails,
  args: {
    bookmark: sampleBookmark,
    properties: sampleProperties,
    placements,
    bookmarkCategory: workflowCategory,
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkCardDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImageAbove: Story = {
  args: {
    hasImageAbove: true,
  },
};
