import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/PreviewBookmarksSection",
  component: PreviewBookmarksSection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    conditions: emptyConditionTree(),
  },
} satisfies Meta<typeof PreviewBookmarksSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The "Search" button plus a live name-check input for testing which bookmarks match. */
export const Default: Story = {};
