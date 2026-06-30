import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { HomepageSectionPreview } from "./HomepageSectionPreview";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/HomepageSectionPreview",
  component: HomepageSectionPreview,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    conditions: emptyConditionTree(),
  },
} satisfies Meta<typeof HomepageSectionPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The labeled "Preview Bookmarks" section with an empty condition tree. */
export const Default: Story = {};
